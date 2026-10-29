import os
from pathlib import Path
from api.legacy.analysis.lifetime import compute_convolved_fit_curve, fit_decay, simulate_irf
from api.legacy.analysis.histograms import build_decay_histogram
from api.models.analysis_models import LifetimeReq, LifetimeRes
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement
from api.services.storage_service import download_to_temp
from api.services.file_readers.reader_factory import read_file
from api.services.hdf5_services import read_irf
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
import json
import numpy as np


def _find_irf_mapping(dataset_ref: str, measurement_id, channel: int, workspace_id: str | None):
    query = supabaseClient.table("irf_mappings").select("irf_id")
    if workspace_id:
        query = query.eq("workspace_id", workspace_id)
    mapping = (query
               .eq("dataset_ref", dataset_ref)
               .eq("measurement_id", measurement_id)
               .eq("channel", channel)
               .maybe_single()
               .execute())
    return mapping.data if mapping is not None and mapping.data else None


def _fetch_irf_data(dataset_ref: str, measurement_id: int, channel: int, workspace_id: str | None = None):
    """
    Find the IRF Mapping for this measurement, download it from Supabase, and parse it.

    Follows the same rules as get_mapped_irf_controller (the IRF name shown in the UI):
    a measurement's own mapping wins, a mapping cleared for the measurement (irf_id null)
    means no IRF, and otherwise the dataset-wide mapping (measurement_id -1) applies.
    """
    mapping = _find_irf_mapping(dataset_ref, measurement_id, channel, workspace_id)
    if mapping is None and str(measurement_id) != "-1":
        mapping = _find_irf_mapping(dataset_ref, -1, channel, workspace_id)

    if mapping is None or mapping.get("irf_id") is None:
        return None

    irf_id = mapping["irf_id"]

    irf_record = (supabaseClient.table("workspace_irfs")
                  .select("storage_key")
                  .eq("id", irf_id)
                  .single()
                  .execute())
                  
    if irf_record is None or not irf_record.data:
        return None
    
    storage_key = irf_record.data["storage_key"]
    suffix = Path(storage_key).suffix
    temp_path = download_to_temp(storage_key, file_extension=suffix)
    
    return read_irf(temp_path)


def _fetch_irf_counts(dataset_ref: str, measurement_id: int, channel: int, workspace_id: str | None = None):
    parsed = _fetch_irf_data(dataset_ref, measurement_id, channel, workspace_id)
    if parsed and "counts" in parsed:
        return np.array(parsed["counts"], dtype=np.float64)
    return None
    

def _get_native_block_data(upload_id: str, block_id: str | int):
    """Helper to fetch a native decay histogram block (e.g. from SDT/PHU)."""
    get_storage_key = supabaseClient.table("hdf5_uploads").select("storage_key").eq("id", upload_id).execute()
    if not get_storage_key.data:
        return None
        
    storage_key = get_storage_key.data[0]['storage_key']
    suffix = Path(storage_key).suffix.lower() or ".tmp"
    temp_path = download_to_temp(storage_key, suffix)
    
    try:
        result = read_file(temp_path)
        if not result.success or not result.native_blocks:
            return None
            
        # Look for the specific block, or fallback to the first decay_histogram
        for block in result.native_blocks:
            if str(block.id) == str(block_id) and block.kind == "decay_histogram":
                return block
                
        for block in result.native_blocks:
            if block.kind == "decay_histogram":
                return block
                
        return None
    finally:
        if os.path.exists(temp_path):
            try: 
                os.unlink(temp_path)
            except Exception:
                pass
def _full_range_residuals(
    times: np.ndarray,
    counts: np.ndarray,
    fit_curve: np.ndarray,
    fit_start: int,
    fit_end: int,
    background: float,
    average_lifetime: float,
) -> list[float | None]:
    """Weighted residuals (data - fit) over the whole decay, as in the legacy Lifetime tab.

    Outside the fit window the model is continued smoothly: linearly from the
    background up to the first fitted point, and as a single exponential with
    the average lifetime after the last fitted point.
    """
    n_points = len(times)
    if len(fit_curve) == 0 or fit_end <= fit_start:
        return [None] * n_points

    residuals = np.zeros(n_points)

    fit_data = counts[fit_start:fit_end]
    residuals[fit_start:fit_end] = (fit_data - fit_curve) / np.sqrt(np.maximum(fit_data, 1.0))

    if fit_start > 0:
        pre_data = counts[:fit_start]
        fraction = np.linspace(0, 1, fit_start)
        pre_expected = background + fraction * (fit_curve[0] - background)
        residuals[:fit_start] = (pre_data - pre_expected) / np.sqrt(np.maximum(pre_data, 1.0))

    if fit_end < n_points and average_lifetime > 0:
        post_data = counts[fit_end:]
        t0 = times[fit_end - 1]
        extrapolated = background + (fit_curve[-1] - background) * np.exp(
            -(times[fit_end:] - t0) / average_lifetime
        )
        residuals[fit_end:] = (post_data - extrapolated) / np.sqrt(np.maximum(post_data, 1.0))

    return residuals.tolist()


def _describe_irf_used(payload: LifetimeReq, fit_result, channel_width: float, irf_counts):
    """Return (source, fwhm_ns, irf_counts) for the IRF the fit actually used.

    A fitted FWHM replaces the initial one, so the simulated IRF is rebuilt
    with the fitted width (legacy behaviour).
    """
    counts = np.array(payload.counts, dtype=np.float64)
    if payload.fit_irf_fwhm and fit_result.fitted_irf_fwhm:
        fwhm = float(fit_result.fitted_irf_fwhm)
        irf, _ = simulate_irf(channelwidth=channel_width, fwhm=fwhm, measured=counts)
        return "simulated", fwhm, irf.tolist()
    if payload.use_irf and payload.simulated_irf_fwhm is not None:
        return "simulated", float(payload.simulated_irf_fwhm), np.asarray(irf_counts).tolist()
    if irf_counts is not None:
        return "mapped", None, np.asarray(irf_counts, dtype=np.float64).tolist()
    return None, None, None


def lifetime_fitting(payload: LifetimeReq):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id

    channel = getattr(payload, 'channel', 1) or 1
    
    if payload.channelwidth is not None and payload.channelwidth > 0:
        channel_width = payload.channelwidth
    else:
        cached_measurement = get_cached_measurement(upload_id, measurement_id)

        if not cached_measurement:
            cached_measurement = cache_fallback_service(
                upload_id=upload_id, measurement_id=measurement_id
            )

        if cached_measurement:
            if isinstance(cached_measurement, dict):
                channel_width = cached_measurement.get("channelwidth", 0.0)
            else:
                channel_width = getattr(cached_measurement, "channelwidth", 0.0)
        else:
            native_block = _get_native_block_data(upload_id, measurement_id)
            if native_block and "time" in native_block.axes and len(native_block.axes["time"]) > 1:
                times = native_block.axes["time"]
                channel_width = float(times[1] - times[0])
            else:
                channel_width = 0.0

    irf_counts = None
    if payload.use_irf and payload.simulated_irf_fwhm is not None:
        if channel_width <= 0:
            raise ValueError("Channel width is required to simulate an IRF")
        if payload.simulated_irf_fwhm <= 0:
            raise ValueError("Simulated IRF FWHM must be greater than 0")
        irf_counts, _ = simulate_irf(
            channelwidth=channel_width,
            fwhm=payload.simulated_irf_fwhm,
            measured=np.array(payload.counts, dtype=np.float64),
        )
    elif payload.use_irf:
        irf_counts = _fetch_irf_counts(
            dataset_ref=upload_id,
            measurement_id=measurement_id,
            channel=channel,
            workspace_id=payload.workspace_id,
        )

        # Pass real IRF if available, otherwise None (fit_decay defaults to delta)
    has_real_irf = irf_counts is not None or payload.fit_irf_fwhm

    fit_result = fit_decay(
        counts=np.array(payload.counts, dtype=np.int64),
        t=np.array(payload.times, dtype=np.float64),
        channelwidth=channel_width,
        irf=irf_counts if irf_counts is not None else None,
        num_exponentials=payload.num_exponentials,
        tau_init=payload.tau_init,
        tau_bounds=payload.tau_bounds,
        tau_bounds_per_component=payload.tau_bounds_per_component,
        amp_init=payload.amp_init,
        amp_bounds=payload.amp_bounds,
        shift_init=payload.shift_init,
        shift_bounds=payload.shift_bounds,
        start=payload.start,
        end=payload.end,
        autostart=payload.autostart,
        autoend=payload.autoend,
        background=payload.background,
        irf_background=payload.irf_background,
        settings=payload.settings,
        fit_irf_fwhm=payload.fit_irf_fwhm,
        irf_fwhm_init=payload.irf_fwhm_init,
        irf_fwhm_bounds=payload.irf_fwhm_bounds
    )
    
    times_arr = np.array(payload.times, dtype=np.float64)
    n_points = len(times_arr)
    si = fit_result.fit_start_index
    ei = fit_result.fit_end_index
    max_data_count = max(payload.counts) if payload.counts else 1.0

    fitted_curve_list = None

    # Path A: If a real IRF or simulated IRF is present, try full convolved reconstruction
    if has_real_irf:
        try:
            full_curve, _ = compute_convolved_fit_curve(
                t_ns=times_arr,
                counts=np.array(payload.counts, dtype=np.int64),
                channelwidth=channel_width,
                tau=tuple(fit_result.tau),
                amplitude=tuple(fit_result.amplitude),
                shift_ns=fit_result.shift,
                background=fit_result.background,
                fit_start_index=si,
                fit_end_index=ei,
                irf_fwhm_ns=fit_result.fitted_irf_fwhm if payload.fit_irf_fwhm else None,
                irf_array=None if payload.fit_irf_fwhm else irf_counts
            )
            # Guard against normalization blowup
            if full_curve.max() <= 10.0 * max_data_count and not np.isnan(full_curve).any():
                fitted_curve_list = full_curve.tolist()
        except Exception:
            fitted_curve_list = None

    # Path B: Legacy fallback (No IRF or reconstruction failed/diverged)
    # Uses fit_result.fitted_curve in-range and extrapolates to the right with average_lifetime
    if fitted_curve_list is None:
        fitted_slice = fit_result.fitted_curve.tolist()
        fitted_curve_list = [None] * n_points
        
        # 1. Fill fit window
        for i, val in enumerate(fitted_slice):
            if si + i < n_points:
                fitted_curve_list[si + i] = float(val)
        
        # 2. Extrapolate to the right using average_lifetime
        if len(fitted_slice) > 0 and ei < n_points:
            y_end = fitted_slice[-1]
            t_end = times_arr[min(ei - 1, n_points - 1)]
            tau_avg = fit_result.average_lifetime if fit_result.average_lifetime > 0 else 1.0
            bg = fit_result.background
            
            for k in range(ei, n_points):
                dt = times_arr[k] - t_end
                extrap = (y_end - bg) * np.exp(-dt / tau_avg) + bg
                fitted_curve_list[k] = float(max(extrap, bg))

    full_residuals = _full_range_residuals(
        times=times_arr,
        counts=np.array(payload.counts, dtype=np.float64),
        fit_curve=np.array(fit_result.fitted_curve, dtype=np.float64),
        fit_start=si,
        fit_end=ei,
        background=fit_result.background,
        average_lifetime=fit_result.average_lifetime,
    )
    irf_source, irf_fwhm, irf_used = _describe_irf_used(
        payload, fit_result, channel_width, irf_counts
    )

    res_data = {
        "times": payload.times,
        "counts": payload.counts,
        "tau": list(fit_result.tau),
        "tau_std": list(fit_result.tau_std),
        "amplitude": list(fit_result.amplitude),
        "amplitude_std": list(fit_result.amplitude_std),
        "shift": float(fit_result.shift),
        "shift_std": float(fit_result.shift_std),
        "chi_squared": float(fit_result.chi_squared),
        "durbin_watson": float(fit_result.durbin_watson),
        "dw_bounds": list(fit_result.dw_bounds) if fit_result.dw_bounds else None,
        "residuals": full_residuals,
        "fitted_curve": fitted_curve_list,        # Send the full array
        "fit_start_index": int(fit_result.fit_start_index),
        "fit_end_index": int(fit_result.fit_end_index),
        "background": float(fit_result.background),
        "num_exponentials": int(fit_result.num_exponentials),
        "average_lifetime": float(fit_result.average_lifetime),
        "fitted_irf_fwhm": (
            float(fit_result.fitted_irf_fwhm) if fit_result.fitted_irf_fwhm else None
        ),
        "fitted_irf_fwhm_std": (
            float(fit_result.fitted_irf_fwhm_std)
            if fit_result.fitted_irf_fwhm_std
            else None
        ),
        "channelwidth": float(channel_width),
        "irf_source": irf_source,
        "irf_fwhm": irf_fwhm,
        "irf": irf_used,
    }

    return LifetimeRes(**res_data)


def _select_photons(microtimes: np.ndarray, start_idx=None, end_idx=None, photon_ranges=None) -> np.ndarray:
    """Restrict microtimes to one level (start/end) or several levels (a group's photon_ranges).

    Ranges are inclusive photon indices, as stored on CPA levels.
    """
    if photon_ranges is not None and (start_idx is not None or end_idx is not None):
        raise ValueError("Use either a single photon range or photon_ranges, not both")

    if start_idx is not None or end_idx is not None:
        if start_idx is None or end_idx is None:
            raise ValueError("Both photon indices are required for a level decay")
        photon_ranges = [(start_idx, end_idx)]

    if photon_ranges is None:
        return microtimes
    if len(photon_ranges) == 0:
        raise ValueError("photon_ranges must contain at least one range")
    for start, end in photon_ranges:
        if start < 0 or end < start or end >= len(microtimes):
            raise ValueError("Level photon indices are outside the selected channel")
    return np.concatenate([microtimes[start : end + 1] for start, end in photon_ranges])


def fluorescence_decay(payload):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id
    channel_key = f"channel{getattr(payload, 'channel', 1) or 1}"       
    cached_measurement = get_cached_measurement(upload_id, measurement_id)

    if not cached_measurement:
        cached_measurement = cache_fallback_service(
            upload_id=upload_id, measurement_id=measurement_id
        )

    if cached_measurement:
        if isinstance(cached_measurement, dict):
            channel_data = cached_measurement.get(channel_key) or cached_measurement.get("channel1", {})
            microtimes = channel_data.get("microtimes", [])
            channel_width = cached_measurement.get("channelwidth", 0.0)
        else:
            channel_data = getattr(cached_measurement, channel_key, getattr(cached_measurement, "channel1", None))
            microtimes = channel_data.microtimes if channel_data else []
            channel_width = getattr(cached_measurement, "channelwidth", 0.0)

        microtimes_arr = _select_photons(
            np.asarray(microtimes, dtype=np.float64),
            start_idx=getattr(payload, "start_photon_idx", None),
            end_idx=getattr(payload, "end_photon_idx", None),
            photon_ranges=getattr(payload, "photon_ranges", None),
        )
        if channel_width > 0 and len(microtimes_arr) > 0 and not np.all(microtimes_arr == 0):
            times, counts = build_decay_histogram(
                microtimes=microtimes_arr, channelwidth=channel_width
            )
        else:
            times, counts = np.array([]), np.array([])
    else:
        # If no cached measurement, check if it's a native block (SDT/PHU)
        native_block = _get_native_block_data(upload_id, measurement_id)
        if native_block:
            times = native_block.axes.get("time", np.array([]))
            counts = native_block.data
            
            if len(times) > 0:
                # If it's a 2D matrix (like FLIM or multi-curve), sum over other axes or take the first
                if counts.ndim > 1:
                    if counts.shape[-1] == len(times):
                        counts = counts.sum(axis=tuple(range(counts.ndim - 1)))
                    else:
                        counts = counts.flatten()[:len(times)]
                counts = counts.astype(int)
            else:
                times, counts = np.array([]), np.array([])
        else:
            times, counts = np.array([]), np.array([])

    if len(times) == 0:
        return {"times": [], "counts": []}

    # Fetch mapped IRF if there is one mapped
    irf_info = _fetch_irf_data(
        dataset_ref=upload_id,
        measurement_id=measurement_id,
        channel=getattr(payload, 'channel', 1) or 1,
        workspace_id=getattr(payload, 'workspace_id', None),
    )
    
    return {
        "times": times.tolist(),
        "counts": counts.tolist(),
        "irf": irf_info
    }
