from pathlib import Path

from api.legacy.analysis.lifetime import fit_decay
from api.legacy.analysis.histograms import build_decay_histogram
from api.models.analysis_models import LifetimeReq, LifetimeRes
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement
from api.utils.supabase_client import supabaseClient
from api.services.storage_service import storage_service
from api.services.hdf5_services import read_irf
from api.utils.redis_Client import redisClient
import json
import numpy as np

def _fetch_irf_counts(dataset_ref: str, measurement_id: int, channel: int):
    """
    Find the IRF Mapping for this measurement, download it from supabase, parse it and return the counts array
    """
    mapping = (supabaseClient.table("irf_mappings")
               .select("irf_id")
               .eq("dataset_ref", dataset_ref)
               .eq("measurement_id", measurement_id)
               .eq("channel", channel)
               .maybe_single()
               .execute())
    
    if not mapping.data:
        mapping = (supabaseClient.table("irf_mappings")
                   .select("irf_id")
                   .eq("dataset_ref", dataset_ref)
                   .eq("measurement_id", -1)
                   .eq("channel", channel)
                   .maybe_single()
                   .execute())

    if not mapping.data:
        return None # no irf mapping found
    
    storage_key = irf_record.data["storage_key"]
    
    suffix = Path(storage_key).suffix
    temp_path = storage_service.download_to_temp(storage_key, file_extension=suffix)
    
    parsed_irf = read_irf(temp_path)
    if parsed_irf:
        # fit_decay only needs the counts array as a numpy array
        return np.array(parsed_irf["counts"], dtype=np.float64)
        
    return None
    

def lifetime_fitting(payload: LifetimeReq):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id

    cached_measurement = get_cached_measurement(upload_id, measurement_id)

    if not cached_measurement:
        cached_measurement = cache_fallback_service(
            upload_id=upload_id, measurement_id=measurement_id
        )

    if isinstance(cached_measurement, dict):
        channel_width = cached_measurement["channelwidth"]
    else:
        channel_width = cached_measurement.channelwidth

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

    return {"times": times.tolist(), "counts": counts.tolist()}
