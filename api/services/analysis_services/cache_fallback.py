import json
import os
from pathlib import Path
from typing import Optional, Union

from api.legacy.io.hdf5_reader import read_single_measurement
from api.legacy.models.measurement import MeasurementData
from api.services.hdf5_services import read_hdf5
from api.services.measurement_cache_service import cache_measurement, get_cached_measurement
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
from api.services.storage_service import download_to_temp
from api.services.format_detection_service import FileFormat, detect_format
from api.services.file_readers.legacy_adapter import to_legacy_measurement
from api.services.file_readers.reader_factory import read_file


def _load_custom_hdf5_measurement(upload_id: str, path: str, measurement_id: str | int):
    measurement = read_single_measurement(path=path, measurement_id=measurement_id)
    if measurement is not None:
        cache_measurement(upload_id, measurement_id, measurement)
        return measurement

    read_result = read_hdf5(path)
    measurements = read_result.get("measurements", []) if isinstance(read_result, dict) else []
    for item in measurements:
        item_id = item.get("id") if isinstance(item, dict) else getattr(item, "id", None)
        value = json.dumps(item) if isinstance(item, dict) else item
        redisClient.set(f"raw_data:{upload_id}:{item_id}", value)
        if str(item_id) == str(measurement_id):
            return redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    return redisClient.get(f"raw_data:{upload_id}:{measurement_id}")


def _load_event_measurement(upload_id: str, path: str, measurement_id: str | int):
    result = read_file(path)
    if not result.success or result.native_blocks:
        return None

    for item in result.measurements:
        measurement = to_legacy_measurement(item)
        cache_measurement(upload_id, item.id, measurement)
        if str(item.id) == str(measurement_id):
            return measurement
    return None


def cache_fallback_service(upload_id: str, measurement_id: str | int = 1) -> Optional[Union[MeasurementData, dict, str]]:
    cached_data = get_cached_measurement(upload_id=upload_id, measurement_id=measurement_id)
    if cached_data:
        return cached_data
    
    get_storage_key = supabaseClient.table("hdf5_uploads").select("storage_key").eq("id", upload_id).execute()
    storage_key = get_storage_key.data[0]['storage_key']
    
    suffix = Path(storage_key).suffix.lower() or ".tmp"
    temp_hdf5_path = download_to_temp(storage_key, suffix)
    try:
        detected_format, _ = detect_format(temp_hdf5_path)
        if detected_format == FileFormat.HDF5_CUSTOM or (
            detected_format == FileFormat.UNKNOWN and suffix in {".h5", ".hdf5"}
        ):
            return _load_custom_hdf5_measurement(upload_id, temp_hdf5_path, measurement_id)
        if detected_format == FileFormat.UNKNOWN:
            return None
        return _load_event_measurement(upload_id, temp_hdf5_path, measurement_id)
    finally:
        if temp_hdf5_path and os.path.exists(temp_hdf5_path):
            try: 
                os.remove(temp_hdf5_path)
            except Exception:
                pass

