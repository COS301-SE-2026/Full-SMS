from pathlib import Path

from api.legacy.analysis.lifetime import compute_convolved_fit_curve, fit_decay
from api.legacy.analysis.histograms import build_decay_histogram
from api.models.analysis_models import LifetimeReq, LifetimeRes
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement
from api.utils.supabase_client import supabaseClient
from api.services.storage_service import download_to_temp
from api.services.hdf5_services import read_irf
from api.utils.redis_Client import redisClient
import numpy as np


def _fetch_irf_data(dataset_ref: str, measurement_id: int, channel: int):
    """
    Find the IRF Mapping for this measurement, download it from Supabase, and parse it.
    """
    mapping = (supabaseClient.table("irf_mappings")
               .select("irf_id")
               .eq("dataset_ref", dataset_ref)
               .eq("measurement_id", measurement_id)
               .eq("channel", channel)
               .maybe_single()
               .execute())
    
    if mapping is None or not mapping.data:
        mapping = (supabaseClient.table("irf_mappings")
                   .select("irf_id")
                   .eq("dataset_ref", dataset_ref)
                   .eq("measurement_id", -1)
                   .eq("channel", channel)
                   .maybe_single()
                   .execute())

    if mapping is None or not mapping.data:
        return None
    
    irf_id = mapping.data["irf_id"]

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


def _fetch_irf_counts(dataset_ref: str, measurement_id: int, channel: int):
    parsed = _fetch_irf_data(dataset_ref, measurement_id, channel)
    if parsed and "counts" in parsed:
        return np.array(parsed["counts"], dtype=np.float64)
    return None
    

def lifetime_fitting(payload: LifetimeReq):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id

    channel = getattr(payload, 'channel', 1) or 1
    cached_measurement = get_cached_measurement(upload_id, measurement_id)

    if not cached_measurement:
        cached_measurement = cache_fallback_service(
            upload_id=upload_id, measurement_id=measurement_id
        )

    if isinstance(cached_measurement, dict):
        channel_width = cached_measurement["channelwidth"]
    else:
        channel_width = cached_measurement.channelwidth

    irf_counts = (
        _fetch_irf_counts(
            dataset_ref=upload_id,
            measurement_id=measurement_id,
            channel=channel,
        )
        if payload.use_irf
        else None
    )
    
        # Pass real IRF if available, otherwise None (fit_decay defaults to delta)
    has_real_irf = irf_counts is not None or payload.fit_irf_fwhm

    fit_result = fit_decay(
        counts=np.array(payload.counts, dtype=np.float64),
        t=np.array(payload.times, dtype=np.float64),
        channelwidth=channel_width,
        irf=irf_counts if irf_counts is not None else None,
        num_exponentials=payload.num_exponentials,
        tau_init=payload.tau_init,
        tau_bounds=payload.tau_bounds,
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

    fit_curve_arr = np.array(fit_result.fitted_curve, dtype=np.float64)
    data_arr = np.array(payload.counts, dtype=np.float64)
    
    # Build padded residuals array (matching fit window)
    padded_residuals = [None] * n_points
    if len(fit_curve_arr) > 0 and ei > si:
        fit_data = data_arr[si:ei]
        sigma = np.sqrt(np.maximum(fit_data, 1.0))
        # Note the order: data - fit (Legacy UI display formula)
        ui_residuals = (fit_data - fit_curve_arr) / sigma
        for i, val in enumerate(ui_residuals.tolist()):
            if si + i < n_points:
                padded_residuals[si + i] = float(val)
    

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
        "residuals": padded_residuals,
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
    }

    return LifetimeRes(**res_data)


def fluorescence_decay(payload):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id
    channel_key = f"channel{getattr(payload, 'channel', 1) or 1}"       
    cached_measurement = get_cached_measurement(upload_id, measurement_id)

    if not cached_measurement:
        cached_measurement = cache_fallback_service(
            upload_id=upload_id, measurement_id=measurement_id
        )

    if isinstance(cached_measurement, dict):
        channel_data = cached_measurement.get(channel_key) or cached_measurement["channel1"]
        microtimes = channel_data["microtimes"]
        channel_width = cached_measurement["channelwidth"]
    else:
        channel_data = getattr(cached_measurement, channel_key, cached_measurement.channel1)
        microtimes = channel_data.microtimes
        channel_width = cached_measurement.channelwidth
        

    times, counts = build_decay_histogram(
        microtimes=microtimes, channelwidth=channel_width
    )

   # Fetch mapped IRF if there is one maped
    irf_info = _fetch_irf_data(
        dataset_ref=upload_id,
        measurement_id=measurement_id,
        channel=getattr(payload, 'channel', 1) or 1
    )
    return {
        "times": times.tolist(),
        "counts": counts.tolist(),
        "irf": irf_info  # contains {"t": [...], "counts": [...]} or None
    }
