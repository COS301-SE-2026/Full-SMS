from fastapi import HTTPException
from supabase import create_client
import os

supabase = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)


def validate_upload_request(filename: str, size_bytes: int) -> None:
    """
    Validate the upload request.

    Args:
        filename (str): The name of the uploaded file.
        size_bytes (int): The size of the uploaded file in bytes.
    """
    if not filename.endswith((".hdf5", ".h5")):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an HDF5 or H5 file.")
    
    if size_bytes <= 0:
        raise HTTPException(status_code=400, detail="Invalid file size. The file size must be greater than 0 bytes.")



def create_upload_record(user_id: str, filename: str, size_bytes: int, storage_key: str) -> dict:
    """
    Create a record for a new file upload.

    Args:
        user_id (str): The ID of the user.
        filename (str): The name of the uploaded file.
        size_bytes (int): The size of the uploaded file in bytes.
        storage_key (str): The storage key for the uploaded file.

    Returns:
        dict: The created upload record.
    """
    response = (
        supabase.table("hdf5_uploads")
        .insert({
            "user_id": user_id,
            "filename": filename,
            "size_bytes": size_bytes,
            "storage_key": storage_key,
            "sha256": None,
            "status": "initialized",
            "progress": 0
        })
        .select("")
        .execute()
    )
    return response.data[0]

def mark_uploaded(upload_id: str, user_id: str, etag: str | None) -> None:
    """
    Mark an upload as completed.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        etag (str | None): The ETag of the uploaded file.
    """
    supabase.table("hdf5_uploads").update({"status": "uploaded"}).eq("upload_id", upload_id).eq("user_id", user_id).execute()


def set_status(upload_id: str, user_id: str, status: str, *, progress: int | None = None, err_code: str | None = None, err_msg: str | None = None) -> None:
    """
    Set the status of an upload.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        status (str): The new status for the upload.
        progress (int | None): The progress of the upload.
        err_code (str | None): The error code for the upload.
        err_msg (str | None): The error message for the upload.
    """
    if status == "failed":
        supabase.table("hdf5_uploads").update({"status": status, "err_code": err_code, "err_msg": err_msg}).eq("upload_id", upload_id).eq("user_id", user_id).execute()
    else:
        supabase.table("hdf5_uploads").update({"status": status, "progress": progress}).eq("upload_id", upload_id).eq("user_id", user_id).execute()


def get_upload(upload_id: str, user_id: str) -> dict | None:
    """
    Retrieve information about a specific upload.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.

    Returns:
        dict | None: The upload information, or None if not found.
    """
    response = (
        supabase.table("hdf5_uploads")
        .select("*")
        .eq("upload_id", upload_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0] if response.data else None

def save_parse_result(upload_id: str, metadata: dict, measurements: list[dict], result_storage_key: str | None = None) -> None:
    """
    Save the parsing result for a specific upload.

    Args:
        upload_id (str): The ID of the upload.
        metadata (dict): The metadata for the parsed file.
        measurements (list[dict]): The measurements for the parsed file.
        result_storage_key (str | None): The storage key for the parsing result.
    """
    supabase.table("hdf5_results").insert({
        "upload_id": upload_id,
        "metadata": metadata,
        "measurements": measurements,
        "result_storage_key": result_storage_key
    }).execute()