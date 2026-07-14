import os
import tempfile
from pathlib import Path
from fastapi import UploadFile, HTTPException
import api.services.hdf5_services as read_hdf5_service
import api.services.hdf5_upload_service as hdf5_upload_service
import api.services.storage_service as storage_service
import api.services.hdf5_job_service as hdf5_job_service

def init_hdf5_upload(payload: dict, current_user: dict) -> dict:
    """
    Initialize an HDF5 file upload.

    Args:
        payload (dict)
        current_user (dict)
    """

    hdf5_upload_service.validate_upload_request(payload["filename"], payload["size_bytes"])
    hdf5_upload_record = hdf5_upload_service.create_upload_record(user_id=current_user["user"]["id"], filename=payload["filename"],workspace_id=payload["workspace_id"] ,size_bytes=payload["size_bytes"], sha256=payload["sha256"])
    print(f"Created upload record: {hdf5_upload_record}")
    hdf5_upload_url = storage_service.create_signed_upload_url(hdf5_upload_record["storage_key"])

    return {
        "upload_id": hdf5_upload_record["id"],
        "upload_url": hdf5_upload_url,
        "storage_key": hdf5_upload_record["storage_key"],
        "file_size_bytes": hdf5_upload_record["size_bytes"],
        "filename": hdf5_upload_record["filename"],
    }



def complete_hdf5_upload(upload_id: str, current_user: dict) -> dict:
    """
    Complete an HDF5 file upload.
    """
    hdf5_upload = hdf5_upload_service.get_upload(upload_id, current_user["user"]["id"])
    print(f"Retrieved upload record: {hdf5_upload}")
    if not hdf5_upload:
        raise HTTPException(status_code=404, detail="Upload not found.")
    if not storage_service.object_exists(hdf5_upload["storage_key"]):
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    hdf5_upload_service.mark_uploaded(upload_id, current_user["user"]["id"])
    hdf5_upload_service.set_status(upload_id, current_user["user"]["id"], status="uploaded", progress=0)
    hdf5_job_service.enqueue_parse(upload_id, current_user["user"]["id"], hdf5_upload["storage_key"])

    return {"status": "uploaded", "message": "Upload completed and parsing job queued."}



def get_hdf5_upload_status(upload_id: str, current_user: dict) -> dict:
    """
    Get the status of an HDF5 file upload.
    """
    hdf5_upload = hdf5_upload_service.get_upload(upload_id, current_user['user']['id'])
    if not hdf5_upload:
        raise HTTPException(status_code=404, detail="Upload not found.")
    return hdf5_upload.status

def get_hdf5_upload_result(upload_id: str, current_user: dict) -> dict:
    """
    Get the result of an HDF5 file upload.
    """
    hdf5_upload_result = hdf5_upload_service.get_upload_result(upload_id, current_user['user']['id'])
    if hdf5_upload_result is None:
        raise HTTPException(status_code=404, detail="Upload result not found.")
    print(f"Retrieved upload result: {hdf5_upload_result}")
    return hdf5_upload_result

async def read_hdf5_file(file: UploadFile):
    if not file.filename.endswith((".hdf5", ".h5")):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an HDF5 file.")

    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".h5")
        os.close(fd)
        with open(tmp_path, "wb") as f:
            f.write(await file.read())

        return read_hdf5_service.read_hdf5(Path(tmp_path))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

def get_user_uploads_by_id(user_id: str) -> list:
    user_uploads = hdf5_upload_service.get_user_uploads_service(user_id)
    if not user_uploads:
        raise HTTPException(status_code=404, detail="User uploads not found")
    return user_uploads
