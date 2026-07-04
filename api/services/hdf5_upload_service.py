from fastapi import HTTPException


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

def mark_uploaded(upload_id: str, user_id: str, etag: str | None) -> None:
    """
    Mark an upload as completed.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        etag (str | None): The ETag of the uploaded file.
    """

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

def get_upload(upload_id: str, user_id: str) -> dict | None:
    """
    Retrieve information about a specific upload.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.

    Returns:
        dict | None: The upload information, or None if not found.
    """

def save_parse_result(upload_id: str, metadata: dict, measurements: list[dict], result_storage_key: str | None = None) -> None:
    """
    Save the parsing result for a specific upload.

    Args:
        upload_id (str): The ID of the upload.
        metadata (dict): The metadata for the parsed file.
        measurements (list[dict]): The measurements for the parsed file.
        result_storage_key (str | None): The storage key for the parsing result.
    """