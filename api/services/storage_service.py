import tempfile
import os
import pathlib
from fastapi import UploadFile, HTTPException
from supabase import create_client
from utils.supabase_client import supabaseClient


supabase = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)

BUCKET = os.environ.get("SUPABASE_BUCKET_NAME")

def build_storage_key(user_id: str, upload_id: str, file_name: str) -> str:
    """
    Build a storage key for an uploaded file.

    Args:
        user_id (str): The ID of the user.
        upload_id (str): The ID of the upload.
        file_name (str): The name of the file.

    Returns:
        str: The constructed storage key.
    """
    return f"{user_id}/{upload_id}/{file_name}"


def create_signed_upload_url(storage_key: str, expires_seconds: int=900) -> str:
    """
    Create a signed URL for uploading a file to storage.

    Args:
        storage_key (str): The storage key for the file.
        expires_seconds (int): The expiration time in seconds for the signed URL.

    Returns:
        str: The signed URL for uploading the file.
    """

    return supabaseClient.storage.from_(BUCKET).create_signed_upload_url(storage_key)

def object_exists(storage_key: str) -> bool:
    """
    Check if an object exists in storage.

    Args:
        storage_key (str): The storage key for the object.
    """
    print(f"Checking if object exists: {supabaseClient.storage.from_(BUCKET).list(path=storage_key)}")
    if supabaseClient.storage.from_(BUCKET).list(path=storage_key) is not None:
        return True
    return False

def download_to_temp(storage_key: str) -> str: 
    """
    Download an object from storage to a temporary file.

    Args:
        storage_key (str): The storage key for the object.

    """
    fd, tempPath = tempfile.mkstemp(".hdf5" or ".h5" )
    with open(tempPath, "wb+") as f:
        response = (
            supabaseClient.storage
            .from_(BUCKET)
            .download(storage_key)
        )
        f.write(response)
    return tempPath