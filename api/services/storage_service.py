import tempFile
import os
import pathlib
from fastapi import UploadFile, HTTPException
from supabase import create_Client


supabase = create_Client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)

BUCKET = os.environ.get("SUPABASE_BUCKET_NAME")

def build_storage_key(user_id: str, upload_id: str, storage_key: str) -> None:
    """
    Build a storage key for an uploaded file.

    Args:
        user_id (str): The ID of the user.
        upload_id (str): The ID of the upload.
        storage_key (str): The original storage key.

    Returns:
        str: The constructed storage key.
    """
    return f"{user_id}/{upload_id}/{storage_key}"


def create_signed_upload_url(storage_key: str, expires_seconds: int=900) -> str:
    """
    Create a signed URL for uploading a file to storage.

    Args:
        storage_key (str): The storage key for the file.
        expires_seconds (int): The expiration time in seconds for the signed URL.

    Returns:
        str: The signed URL for uploading the file.
    """

    return supabase.storage.create_signed_upload_url(storage_key, expires_seconds)

def object_exists(storage_key: str) -> bool:
    """
    Check if an object exists in storage.

    Args:
        storage_key (str): The storage key for the object.
    """
    if not supabase.storage.from_(BUCKET).list(path=storage_key):
        return False
    return True

def download_to_temp(storage_key: str) -> str: 
    """
    Download an object from storage to a temporary file.

    Args:
        storage_key (str): The storage key for the object.

    """
    fd, tempPath = tempFile.mkstemp(".hdf5" or ".h5" )
    os.close(fd)
    with open(tempPath, "wb+") as f:
        response = (
            supabase.storage
            .from_(BUCKET)
            .download(storage_key)
        )
        f.write(response)
    return tempPath