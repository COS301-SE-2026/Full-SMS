
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from typing import Optional, Dict, Any
import tempfile
import os
import json

from api.services.format_detection_service import detect_format, FileFormat, get_format_info
from api.services.file_readers.reader_factory import (
    read_file,
    get_supported_formats,
    get_all_supported_extensions,
)
from api.routes.profile_routes import get_current_user
import math
from pathlib import Path

from api.services import hdf5_upload_service
from api.services.storage_service import download_to_temp
from contextlib import asynccontextmanager
import uuid
from anyio import Path as AsyncPath



router = APIRouter(prefix="/formats", tags=["File Formats"])
FILE_NAME_ERROR = "File must have a filename"
ALLOWED_EXTENSIONS: Dict[str, str] = {
    ".csv": ".csv",
    ".h5": ".h5",
    ".hdf5": ".hdf5",
    ".phu": ".phu",
    ".ptu": ".ptu",
    ".sdt": ".sdt",
    ".spc": ".spc",
    ".tsv": ".tsv",
    ".txt": ".txt",
}

def get_safe_extension(filename: str) -> str:
    """read and validate file extension against ALLOWED_EXTENSIONS."""
    clean_name = os.path.basename(filename)
    raw_ext = os.path.splitext(clean_name)[1].lower()
    return ALLOWED_EXTENSIONS.get(raw_ext, ".tmp")


#sonarcloud recommendation for maintainability
@asynccontextmanager
async def async_named_temporary_file(suffix: str = ".tmp"):
    """
    Asynchronous temporary file context manager using tempfile.mkstemp.
    Avoids path traversal by delegating file creation to the OS temp subsystem,
    then provides an AsyncPath for non-blocking asynchronous I/O and cleanup.
    """
    safe_suffix = ALLOWED_EXTENSIONS.get(suffix, ".tmp")
    fd, raw_path = tempfile.mkstemp(suffix=safe_suffix)
    os.close(fd)
    temp_file = AsyncPath(raw_path)
    try:
        yield temp_file
    finally:
        await temp_file.unlink(missing_ok=True)

@router.get("/supported")
def list_supported_formats():
    """
    Get list of all supported file formats.

    Returns format IDs, names, extensions, and descriptions.
    """
    formats = get_supported_formats()
    extensions = get_all_supported_extensions()

    return {
        "success": True,
        "formats": formats,
        "all_extensions": extensions,
    }


@router.get("/info/{format_id}")
def get_format_details(format_id: str):
    try:
        fmt = FileFormat(format_id)
        info = get_format_info(fmt)
        return {
            "success": True,
            "format_id": format_id,
            **info,
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown format: {format_id}. Use /formats/supported to list available formats.",
        )


@router.post("/detect")
async def detect_file_format(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Detect the format of an uploaded file.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=FILE_NAME_ERROR,
        )

    clean_filename = os.path.basename(file.filename)
    extension = os.path.splitext(clean_filename)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return {
            "success": False,
            "filename": clean_filename,
            "format": FileFormat.UNKNOWN.value,
            "can_process": False,
            "error": f"Unsupported file extension: {extension}. "
                     f"Supported: {', '.join(sorted(ALLOWED_EXTENSIONS.keys()))}",
        }

    suffix = ALLOWED_EXTENSIONS[extension]
    async with async_named_temporary_file(suffix=suffix) as tmp_file:
        content = await file.read(4096)
        await tmp_file.write_bytes(content)
        tmp_path = str(tmp_file)

    try:
        detected_format, metadata = detect_format(tmp_path)
        format_info = get_format_info(detected_format)

        return {
            "success": True,
            "filename": clean_filename,
            "format": detected_format.value,
            "format_name": format_info.get("name", detected_format.value),
            "format_description": format_info.get("description", ""),
            "can_process": detected_format != FileFormat.UNKNOWN,
            "detection_metadata": metadata,
            "supports_dual_channel": format_info.get("supports_dual_channel", False),
            "supports_spectra": format_info.get("supports_spectra", False),
            "supports_raster": format_info.get("supports_raster", False),
        }
    except Exception as e:
        return {
            "success": False,
            "filename": clean_filename,
            "format": FileFormat.UNKNOWN.value,
            "can_process": False,
            "error": f"Error detecting format: {str(e)}",
        }


@router.post("/preview")
async def preview_file(
    file: UploadFile = File(...),
    column_mapping: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Preview file contents without full processing.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=FILE_NAME_ERROR,
        )

    clean_filename = os.path.basename(file.filename)
    extension = os.path.splitext(clean_filename)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return {
            "success": False,
            "filename": clean_filename,
            "format": FileFormat.UNKNOWN.value,
            "error": f"Unsupported file extension: {extension}",
        }

    options: Dict[str, Any] = {}
    if column_mapping:
        try:
            options["column_mapping"] = json.loads(column_mapping)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid column_mapping JSON",
            )

    suffix = ALLOWED_EXTENSIONS[extension]
    async with async_named_temporary_file(suffix=suffix) as tmp_file:
        content = await file.read()
        await tmp_file.write_bytes(content)
        tmp_path = str(tmp_file)

    try:
        result = read_file(tmp_path, options=options if options else None)

        if not result.success:
            return {
                "success": False,
                "filename": clean_filename,
                "format": result.format_name,
                "error": result.error,
            }
            
         # preview (first 5 measurements with limited info)
        preview_measurements = []
        for m in result.measurements[:5]:
            preview_measurements.append({
                "id": m.id,
                "name": m.name,
                "photon_count_ch1": m.channel1.photon_count,
                "photon_count_ch2": m.channel2.photon_count if m.channel2 else 0,
                "has_dual_channel": m.has_dual_channel,
                "channelwidth_ns": m.channelwidth,
                "tcspc_card": m.tcspc_card,
            })

        return {
            "success": True,
            "filename": clean_filename,
            "format": result.format_name,
            "total_measurements": result.measurement_count,
            "total_photons": result.total_photons,
            "file_metadata": result.file_metadata,
            "preview_measurements": preview_measurements,
            "truncated": result.measurement_count > 5,
        }

    except Exception as e:
        return {
            "success": False,
            "filename": clean_filename,
            "error": f"Error reading file: {str(e)}",
        }


@router.post("/validate")
async def validate_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user),
):
    """
    Validate that a file can be processed.

    Performs full read and returns validation result with any errors or warnings.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=FILE_NAME_ERROR,
        )

    extension = os.path.splitext(file.filename)[1].lower() or ".tmp"
    async with async_named_temporary_file(suffix=extension) as tmp_file:
        content = await file.read()
        await tmp_file.write_bytes(content)
        tmp_path = str(tmp_file)

    try:
        result = read_file(tmp_path)

        if not result.success:
            return {
                "valid": False,
                "filename": file.filename,
                "format": result.format_name,
                "error": result.error,
                "warnings": [],
            }

        warnings = []

        empty_measurements = [m for m in result.measurements if m.total_photons == 0]
        if empty_measurements:
            warnings.append(
                f"{len(empty_measurements)} measurement(s) have no photons"
            )

        # Check for very low photon counts
        low_count = [m for m in result.measurements if 0 < m.total_photons < 100]
        if low_count:
            warnings.append(
                f"{len(low_count)} measurement(s) have very low photon counts (<100)"
            )

        no_channelwidth = [m for m in result.measurements if m.channelwidth <= 0]
        if no_channelwidth:
            warnings.append(
                f"{len(no_channelwidth)} measurement(s) have invalid channel width"
            )

        return {
            "valid": True,
            "filename": file.filename,
            "format": result.format_name,
            "measurement_count": result.measurement_count,
            "total_photons": result.total_photons,
            "warnings": warnings,
        }

    except Exception as e:
        return {
            "valid": False,
            "filename": file.filename,
            "error": f"Validation failed: {str(e)}",
            "warnings": [],
        }



@router.post("/convert")
async def convert_file_to_cache_format(file: UploadFile = File(...),current_user: dict = Depends(get_current_user),
):
    """
    Read file and return measurements in cache-ready format.

    This endpoint is used during file upload to convert any format
    to the internal measurement format for caching.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=FILE_NAME_ERROR,
        )
    filename = os.path.basename(file.filename)
    extension = get_safe_extension(filename=filename)
    async with async_named_temporary_file(suffix=extension) as tmp_file:
        content = await file.read()
        await tmp_file.write_bytes(content)
        tmp_path = str(tmp_file)

    try:
        result = read_file(tmp_path)

        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read file: {result.error}",
            )

        # Convert to cache format (JSON-serializable)
        return {
            "success": True,
            "filename": file.filename,
            "format": result.format_name,
            "file_metadata": result.file_metadata,
            "measurements": [m.to_dict() for m in result.measurements],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting file: {str(e)}",
        )


def _get_native_blocks(upload_id: str, current_user: dict):
    user_id = current_user["user"]["id"]
    upload = hdf5_upload_service.get_upload(upload_id, user_id)

    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    suffix = Path(upload["filename"]).suffix.lower() or ".tmp"
    temp_path = download_to_temp(upload["storage_key"], suffix)

    try:
        result = read_file(temp_path)
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.error or "Could not read uploaded file",
            )
        if not result.native_blocks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload does not contain native data blocks",
            )
        return result.native_blocks
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


@router.get("/uploads/{upload_id}/blocks")
def list_native_blocks(
    upload_id: str,
    current_user: dict = Depends(get_current_user),
):
    blocks = _get_native_blocks(upload_id, current_user)

    return {
        "blocks": [
            {
                "id": block.id,
                "name": block.name,
                "kind": block.kind,
                "shape": list(block.data.shape),
                "axis_units": block.axis_units,
            }
            for block in blocks
        ]
    }


@router.get("/uploads/{upload_id}/blocks/{block_id}")
def get_native_block_view(
    upload_id: str,
    block_id: int,
    view: str = "histogram",
    index: int = 0,
    current_user: dict = Depends(get_current_user),
):
    blocks = _get_native_blocks(upload_id, current_user)
    block = next((item for item in blocks if item.id == block_id), None)

    if block is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data block not found")

    if block.kind == "decay_histogram" and view == "histogram":
        step = max(1, math.ceil(block.data.size / 2000))
        return {
            "kind": "histogram",
            "title": block.name,
            "xlabel": f"Time ({block.axis_units.get('time', 'ns')})",
            "ylabel": "Counts",
            "bins": block.axes["time"][::step].tolist(),
            "counts": block.data[::step].tolist(),
        }

    if block.kind == "curve_matrix" and view == "curves":
        step = max(1, math.ceil(block.data.shape[-1] / 2000))
        times = block.axes["time"][::step]
        return {
            "kind": "curves",
            "title": block.name,
            "xlabel": f"Time ({block.axis_units.get('time', 'ns')})",
            "ylabel": "Counts",
            "series": [
                {
                    "label": f"Curve {curve_index + 1}",
                    "x": times.tolist(),
                    "y": curve[::step].tolist(),
                }
                for curve_index, curve in enumerate(block.data[:16])
            ],
        }

    if block.kind == "flim" and view == "flim_slice":
        if index < 0 or index >= block.data.shape[-1]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST0, detail="Slice index is out of range")

        image = block.data[:, :, index]
        row_step = max(1, math.ceil(image.shape[0] / 256))
        col_step = max(1, math.ceil(image.shape[1] / 256))

        return {
            "kind": "heatmap",
            "title": f"{block.name}, time slice {index}",
            "xlabel": "X pixel",
            "ylabel": "Y pixel",
            "time": float(block.axes["time"][index]),
            "values": image[::row_step, ::col_step].tolist(),
        }

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="View is not supported for this data block",
    )