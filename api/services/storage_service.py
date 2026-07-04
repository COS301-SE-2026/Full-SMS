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


def create_signed_upload_url(storage_key: str, expires_seconds: int=900) -> str:
    """
    Create a signed URL for uploading a file to storage.

    Args:
        storage_key (str): The storage key for the file.
        expires_seconds (int): The expiration time in seconds for the signed URL.

    Returns:
        str: The signed URL for uploading the file.
    """

def object_exists(storage_key: str) -> bool:
    """
    Check if an object exists in storage.

    Args:
        storage_key (str): The storage key for the object.
    """

def download_to_temp(storage_key: str) -> str: 
    """
    Download an object from storage to a temporary file.

    Args:
        storage_key (str): The storage key for the object.

    """