import tempfile
import os
from celery import Celery
import json
from api.services.hdf5_upload_service import save_parse_result, set_status
from api.services.storage_service import download_to_temp, build_storage_key
from api.utils.supabase_client import supabaseClient
from api.services.hdf5_services import read_hdf5
import traceback
import gzip
import redis


app = Celery('hdf5_job_service', broker=os.environ.get("CELERY_BROKER_URL"), backend=os.environ.get("CELERY_RESULT_BACKEND"))

async def enqueue_parse(upload_id: str, user_id: str, storage_key: str) -> None:
    """
    Enqueue a task to parse an HDF5 file.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        storage_key (str): The storage key for the uploaded file.
    """
    # places the parsing task in the queue (SHOULD BE CALLED AFTER UPLOAD IS DONE AND WITH AN await )
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

    #proposed new flow:
    # -> download the file to a  temporary folder
    # -> use read_hdf5_service to parse it
    # -> create a temporary json file to store the measurements
    # -> upload json to its own bucket( this means the measurements field will hold a URL not jsonb )
    # -> update the two hdf5 tables (1. with metadata and measurements(URL), 2. with status and progress)

    #resulting measurements json files are too large to store on free tier of supabase
    #currently trying to compress with gzip first 

    try:
        temp_hdf5_path = download_to_temp(storage_key, ".hdf5")

        read_result = read_hdf5(temp_hdf5_path)
        result_metadata: dict = read_result["metadata"]
        print(f"\n\nParsed metadata: {result_metadata}\n\n")
        result_measurements = read_result["measurements"]
  
        redis_cache = redis.Redis(host="localhost", port= 6379, db=2)
        redis_cache.set(f"raw_data:{upload_id}:{result_measurements}")

        with gzip.open("DEBUG_measurements.json.gz", "wt", encoding='utf-8') as debug_file:
            json.dump(result_measurements, debug_file, indent=4)
        print("\n\nINTERCEPTED: Saved to DEBUG_measurements.json.gz in project root!\n\n")

        fd, temp_json_path = tempfile.mkstemp(suffix=".json.gz") 
        with gzip.open(temp_json_path, 'wt', encoding='utf-8') as compressed_json_file:
            json.dump(result_measurements, compressed_json_file)

        new_json_storage_key = build_storage_key(user_id, upload_id, "measurements.json.gz")
        print(f"\n\nSTORAGE KEY: {new_json_storage_key}\n\n")


        with os.fdopen(fd, "rb") as compressed_json_file:
            json_res = (
                supabaseClient.storage
                .from_("processed_hdf5")
                .upload(path=new_json_storage_key, file=compressed_json_file, file_options={"content-type": "application/gzip"}) # Set the content type to application/gzip - this caused the .pop(error in the celery terminal)
            )
    
        save_parse_result(upload_id, result_metadata, new_json_storage_key, new_json_storage_key)

    except Exception as e:
        print(f"Something happened while parsing the file with upload id-{upload_id}: {e}")
        traceback.print_exc()
    finally:
        # delete temporary file
        if os.path.exists(temp_hdf5_path):
            try:
                os.remove(temp_hdf5_path)
            except Exception as e:
                print(f"Failed to delete temporary HDF5 file: {e}")
        if os.path.exists(temp_json_path):
            try:
                os.remove(temp_json_path)
            except Exception as e:
                print(f"Failed to delete temporary JSON file: {e}")
        try:
            set_status(upload_id, user_id, "parsed", progress=100)  
        except Exception as e:
            print(f"Failed to update status for upload id-{upload_id}: {e}")
        



