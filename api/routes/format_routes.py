"""
File format API routes for Universal File Format Support.

Provides endpoints for:
- Format detection
- Supported formats listing
- File preview/validation
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query, status
from typing import Optional, Dict, Any
from pathlib import Path
import tempfile
import os
import json
import math
import numpy as np

from api.services.format_detection_service import detect_format, FileFormat, get_format_info
from api.services import hdf5_upload_service
from api.services.storage_service import download_to_temp
from api.services.file_readers.reader_factory import (
    read_file,
    get_supported_formats,
    get_all_supported_extensions,
)
from api.routes.profile_routes import get_current_user

router = APIRouter(prefix="/formats", tags=["File Formats"])


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
    """
    Get detailed information about a specific format.

    Args:
        format_id: Format identifier (e.g., "picoquant_ptu", "hdf5_custom")
    """
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

    Reads file header to determine format without full processing.
    Returns format type and basic metadata.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename",
        )

    # Get file extension
    extension = os.path.splitext(file.filename)[1].lower()

    # Check if extension is supported
    supported_extensions = get_all_supported_extensions()
    if extension not in supported_extensions:
        return {
            "success": False,
            "filename": file.filename,
            "format": FileFormat.UNKNOWN.value,
            "can_process": False,
            "error": f"Unsupported file extension: {extension}. "
                     f"Supported: {', '.join(supported_extensions)}",
        }

     for detection
    suffix = extension or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        while content := await file.read(1024 * 1024):
            tmp.write(content)
        tmp_path = tmp.name

    try:
        detected_format, metadata = detect_format(tmp_path)

        format_info = get_format_info(detected_format)

        return {
            "success": True,
            "filename": file.filename,
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
            "filename": file.filename,
            "format": FileFormat.UNKNOWN.value,
            "can_process": False,
            "error": f"Error detecting format: {str(e)}",
        }
    finally:
        
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/preview")
async def preview_file(
    file: UploadFile = File(...),
    column_mapping: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Preview file contents without full processing.

    Reads file and returns summary of measurements found.
    For CSV files, optional column_mapping can specify column names.

    Args:
        file: File to preview
        column_mapping: JSON string with column mapping for CSV files
                       e.g., '{"abstimes": "time_ns", "microtimes": "tcspc"}'
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename",
        )

    # Parse column mapping if provided
    options: Dict[str, Any] = {}
    if column_mapping:
        try:
            options["column_mapping"] = json.loads(column_mapping)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid column_mapping JSON",
            )

    
    extension = os.path.splitext(file.filename)[1].lower() or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
       
        result = read_file(tmp_path, options=options if options else None)

        if not result.success:
            return {
                "success": False,
                "filename": file.filename,
                "format": result.format_name,
                "error": result.error,
            }

        if result.native_blocks:
            blocks = [
                {
                    "id": block.id,
                    "name": block.name,
                    "kind": block.kind,
                    "shape": list(block.data.shape),
                }
                for block in result.native_blocks
            ]
            return {
                "success": True,
                "filename": file.filename,
                "format": result.format_name,
                "data_kind": result.data_kind,
                "total_measurements": len(blocks),
                "native_blocks": blocks,
            }

        #(first 5 measurements with limited details)
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
            "filename": file.filename,
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
            "filename": file.filename,
            "error": f"Error reading file: {str(e)}",
        }
    finally:
        
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/validate")
async def validate_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Validate that a file can be processed.

    Performs full read and returns validation result with any errors or warnings.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename",
        )

    
    extension = os.path.splitext(file.filename)[1].lower() or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

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
    finally:
        
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _read_uploaded_native_blocks(upload_id: str, current_user: dict):
    upload = hdf5_upload_service.get_upload(upload_id, current_user["user"]["id"])
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    suffix = Path(upload["filename"]).suffix.lower() or ".tmp"
    temp_path = download_to_temp(upload["storage_key"], suffix)
    try:
        result = read_file(temp_path)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.error or "Could not read upload")
        if not result.native_blocks:
            raise HTTPException(status_code=400, detail="Upload does not contain native data blocks")
        return result
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


@router.get("/uploads/{upload_id}/blocks")
def list_native_blocks(
    upload_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = _read_uploaded_native_blocks(upload_id, current_user)
    return {
        "filename": result.file_metadata.get("filename"),
        "format": result.format_name,
        "data_kind": result.data_kind,
        "blocks": [
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


@router.get("/uploads/{upload_id}/blocks/{block_id}")
def get_native_block_view(
    upload_id: str,
    block_id: int,
    view: str = Query("histogram"),
    index: int = Query(0, ge=0),
    max_points: int = Query(2000, ge=100, le=5000),
    current_user: dict = Depends(get_current_user),
):
    result = _read_uploaded_native_blocks(upload_id, current_user)
    block = next((item for item in result.native_blocks if item.id == block_id), None)
    if block is None:
        raise HTTPException(status_code=404, detail="Data block not found")

    if block.kind == "decay_histogram" and view == "histogram":
        step = max(1, math.ceil(block.data.size / max_points))
        return {
            "kind": "histogram",
            "title": block.name,
            "xlabel": f"Time ({block.axis_units.get('time', 'ns')})",
            "ylabel": "Counts",
            "bins": block.axes["time"][::step].tolist(),
            "counts": block.data[::step].tolist(),
        }

    if block.kind == "curve_matrix" and view == "curves":
        step = max(1, math.ceil(block.data.shape[-1] / max_points))
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
        if index >= block.data.shape[-1]:
            raise HTTPException(status_code=400, detail="Slice index is out of range")
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

    raise HTTPException(status_code=400, detail="View is not supported for this data block")
