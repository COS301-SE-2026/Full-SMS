import os
from pathlib import Path
from api.legacy.analysis.lifetime import fit_decay
from api.legacy.analysis.histograms import build_decay_histogram
from api.models.analysis_models import LifetimeReq, LifetimeRes
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement
from api.services.storage_service import download_to_temp
from api.services.file_readers.reader_factory import read_file
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
import json
import numpy as np


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


def lifetime_fitting(payload: LifetimeReq):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id

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

    fit_result = fit_decay(
        counts=np.array(payload.counts, dtype=np.float64),
        t=np.array(payload.times, dtype=np.float64),
        channelwidth=channel_width,
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
        "residuals": fit_result.residuals.tolist(),
        "fitted_curve": fit_result.fitted_curve.tolist(),
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

    if cached_measurement:
        if isinstance(cached_measurement, dict):
            channel_data = cached_measurement.get(channel_key) or cached_measurement.get("channel1", {})
            microtimes = channel_data.get("microtimes", [])
            channel_width = cached_measurement.get("channelwidth", 0.0)
        else:
            channel_data = getattr(cached_measurement, channel_key, getattr(cached_measurement, "channel1", None))
            microtimes = channel_data.microtimes if channel_data else []
            channel_width = getattr(cached_measurement, "channelwidth", 0.0)

        microtimes_arr = np.asarray(microtimes, dtype=np.float64)
        if channel_width <= 0 or len(microtimes_arr) == 0 or np.all(microtimes_arr == 0):
            return {"times": [], "counts": []}

        times, counts = build_decay_histogram(
            microtimes=microtimes_arr, channelwidth=channel_width
        )

        return {"times": times.tolist(), "counts": counts.tolist()}

    # If no cached measurement, check if it's a native block (SDT/PHU)
    native_block = _get_native_block_data(upload_id, measurement_id)
    if native_block:
        times = native_block.axes.get("time", np.array([]))
        counts = native_block.data
        
        if len(times) == 0:
             return {"times": [], "counts": []}
        
        # If it's a 2D matrix (like FLIM or multi-curve), sum over other axes or take the first
        if counts.ndim > 1:
            if counts.shape[-1] == len(times):
                counts = counts.sum(axis=tuple(range(counts.ndim - 1)))
            else:
                counts = counts.flatten()[:len(times)]
                
        return {"times": times.tolist(), "counts": counts.astype(int).tolist()}
        
    return {"times": [], "counts": []}
