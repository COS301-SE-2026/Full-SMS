import tempfile
import os
from celery import Celery
from api.services.storage_service import download_to_temp
from api.services.storage_service import BUCKET
from api.utils.supabase_client import supabaseClient
from api.services.hdf5_services import read_hdf5

app = Celery('hdf5_job_service', broker=os.environ.get("CELERY_BROKER_URL"), backend=os.environ.get("CELERY_RESULT_BACKEND"))
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

@app.task
def parse_upload_job(upload_id: str, user_id: str, storage_key: str) -> None:
    """
    Parse an HDF5 file upload.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        storage_key (str): The storage key for the uploaded file.
    """
    #the flow: 
    # -> download the file to a  temporary folder
    # -> use read_hdf5_service to parse it 
    # -> update the two hdf5 tables (1. with metadata and measurements, 2. with status and progress) 
    # -> delete the temporary file

    try:
        temp_hdf5_path = download_to_temp(storage_key)
    except Exception as e:
        print(f"Something happened while downloading the file: {e}")
        return
    try:
        read_result = read_hdf5(temp_hdf5_path)
        response =( 
            supabaseClient.table("hdf5_results")
            .insert({
                "upload_id": upload_id,
                "metadata": read_result["metadata"],
                "measurements": read_result["measurements"],
                "raw_result_storage_key": storage_key
            })
            .execute()
        )

        return {
            "status": "completed",
            "message": "Upload and parsing completed successfully!"
        }
    except Exception as e:
        print(f"Something happened while parsing the file: {e}")
        return
    finally:
        # delete temporary file
        if os.path.exists(temp_hdf5_path):
            os.remove(temp_hdf5_path)
        status_response =(
            supabaseClient.table("hdf5_uploads")
            .update({
                "status": "parsed",
                "progress": 100
            })
            .eq("upload_id", upload_id)
            .eq("user_id", user_id)
            .execute()
        )
        



