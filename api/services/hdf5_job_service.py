import hashlib
import os
import traceback
from pathlib import Path
from celery import shared_task
from api.legacy.io.hdf5_reader import extract_file_metadata_only, read_single_measurement
from api.services import hdf5_upload_service
from api.services.hdf5_upload_service import save_parse_result, set_status
from api.services.measurement_cache_service import cache_measurement
from api.services.storage_service import download_to_temp
from api.utils.supabase_client import supabaseClient
from api.services.format_detection_service import FileFormat, detect_format
from api.services.file_readers.legacy_adapter import to_legacy_measurement
from api.services.file_readers.reader_factory import read_file


def _store_upload_hash(upload_id: str, path: str) -> None:
    digest = hashlib.sha256()
    with open(path, "rb") as uploaded_file:
        for chunk in iter(lambda: uploaded_file.read(1024 * 1024), b""):
            digest.update(chunk)
    supabaseClient.table("hdf5_uploads").update(
        {"sha256": digest.hexdigest()}
    ).eq("id", upload_id).execute()


def _parse_custom_hdf5(upload_id: str, path: Path, filename: str) -> dict:
    metadata, summaries = extract_file_metadata_only(path)
    for measurement_id in range(1, metadata.num_measurements + 1):
        measurement = read_single_measurement(path, measurement_id)
        if measurement:
            cache_measurement(upload_id, measurement_id, measurement)

    return {
        "filename": filename,
        "source_format": FileFormat.HDF5_CUSTOM.value,
        "data_kind": "photon_events",
        "num_measurements": metadata.num_measurements,
        "has_spectra": metadata.has_spectra,
        "has_rasters": metadata.has_raster,
        "measurements_summary": summaries,
    }


def _native_result_metadata(result, filename: str, detected_format: FileFormat) -> dict:
    summaries = []
    for block in result.native_blocks:
        if block.kind == "decay_histogram":
            channel_width = 0.0
            if "time" in block.axes and len(block.axes["time"]) > 1:
                channel_width = float(block.axes["time"][1] - block.axes["time"][0])
            
            summaries.append({
                "id": block.id,
                "name": block.name,
                "channelWidth": channel_width,
                "channels": ["Channel 1"]
            })

    return {
        "filename": filename,
        "source_format": detected_format.value,
        "format_name": result.format_name,
        "data_kind": result.data_kind,
        "num_measurements": len(result.native_blocks),
        "has_spectra": False,
        "has_rasters": False,
        "measurements_summary": summaries,
        "native_blocks": [
            {
                "id": block.id,
                "name": block.name,
                "kind": block.kind,
                "shape": list(block.data.shape),
                "axis_units": block.axis_units,
            }
            for block in result.native_blocks
        ],
    }


def _event_result_metadata(upload_id: str, result, filename: str, detected_format: FileFormat) -> dict:
    if not result.measurements:
        raise ValueError("The file contains no measurements")

    summaries = []
    for measurement in result.measurements:
        legacy_measurement = to_legacy_measurement(measurement)
        cache_measurement(upload_id, measurement.id, legacy_measurement)
        channels = ["Channel 1", "Channel 2"] if measurement.channel2 else ["Channel 1"]
        summaries.append({
            "id": measurement.id,
            "name": measurement.name,
            "channelWidth": measurement.channelwidth,
            "channels": channels,
        })

    return {
        "filename": filename,
        "source_format": detected_format.value,
        "format_name": result.format_name,
        "data_kind": "photon_events",
        "num_measurements": result.measurement_count,
        "has_spectra": False,
        "has_rasters": False,
        "measurements_summary": summaries,
    }


def _parse_reader_file(upload_id: str, path: str, filename: str, detected_format: FileFormat) -> dict:
    result = read_file(path, format_hint=detected_format)
    if not result.success:
        raise ValueError(result.error or "Could not read uploaded file")
    if result.native_blocks:
        return _native_result_metadata(result, filename, detected_format)
    return _event_result_metadata(upload_id, result, filename, detected_format)


def enqueue_parse(upload_id: str, user_id: str, storage_key: str) -> None:
    """
    Enqueue a task to parse an HDF5 file.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        storage_key (str): The storage key for the uploaded file.
    """
    # places the parsing task in the queue (SHOULD BE CALLED AFTER UPLOAD IS DONE AND WITH AN await )
    parse_upload_job.delay(upload_id, user_id, storage_key)

@shared_task(name="parse_hdf5_file")
def parse_upload_job(upload_id: str, user_id: str, storage_key: str) -> None:
    """
    Parse an HDF5 file upload.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        storage_key (str): The storage key for the uploaded file.
    """
    temp_path = None

    try:
        set_status(upload_id, user_id, "processing", progress=25)
        upload_record = hdf5_upload_service.get_upload(upload_id, user_id)
        if not upload_record:
            raise ValueError("Upload record not found")

        filename = upload_record["filename"]
        suffix = Path(filename).suffix.lower() or ".tmp"
        temp_path = download_to_temp(storage_key, suffix)
        _store_upload_hash(upload_id, temp_path)

        detected_format, _ = detect_format(temp_path)
        set_status(upload_id, user_id, "processing", progress=50)

        if detected_format == FileFormat.HDF5_CUSTOM:
            result_metadata = _parse_custom_hdf5(upload_id, Path(temp_path), filename)
        else:
            result_metadata = _parse_reader_file(
                upload_id, temp_path, filename, detected_format
            )

        set_status(upload_id, user_id, "processing", progress=85)
        save_parse_result(
            upload_id=upload_id,
            metadata=result_metadata,
            measurements=storage_key,
            result_storage_key=storage_key,
        )
        set_status(upload_id, user_id, "parsed", progress=100)

    except Exception as e:
        print(f"Something happened while parsing the file with upload id-{upload_id}: {e}")
        traceback.print_exc()
        try:
            set_status(upload_id, user_id, "failed", progress=100)
        except Exception:
            traceback.print_exc()
        raise
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Failed to delete temporary upload file: {e}")
        



