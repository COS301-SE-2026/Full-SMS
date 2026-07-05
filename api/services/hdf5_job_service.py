
async def enqueue_parse(upload_id: str, user_id: str, storage_key: str) -> None:
    """
    Enqueue a task to parse an HDF5 file.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        storage_key (str): The storage key for the uploaded file.
    """
    # Enqueue the parsing job using Celery
    parse_upload_job.delay(upload_id, user_id, storage_key)


def parse_upload_job(upload_id: str, user_id: str, storage_key: str) -> None:
    """
    Parse an HDF5 file upload.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        storage_key (str): The storage key for the uploaded file.
    """