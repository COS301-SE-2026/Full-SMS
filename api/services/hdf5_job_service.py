from pathlib import Path
import tempfile
import os
from celery import Celery, shared_task
import json
from api.legacy.io.hdf5_reader import extract_file_metadata_only, read_single_measurement
from api.services.hdf5_upload_service import save_parse_result, set_status
from api.services.measurement_cache_service import cache_measurement, get_cached_measurement
from api.services.storage_service import download_to_temp, build_storage_key
from api.utils.supabase_client import supabaseClient
from api.utils.redis_Client import redisClient
from api.services.hdf5_services import read_hdf5
import traceback
import gzip

def enqueue_parse(upload_id: str, user_id: str, storage_key: str) -> None:
    """
    Enqueue a task to parse an HDF5 file.

    Args:
        upload_id (str): The ID of the upload.
        user_id (str): The ID of the user.
        storage_key (str): The storage key for the uploaded file.
    """
    # places the parsing task in the queue (SHOULD BE CALLED AFTER UPLOAD IS DONE AND WITH AN await )
    parse_upload_job.delay(upload_id, user_id, storage_key)

@shared_task(name="parse_hdf5_file")
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
    temp_hdf5_path = None
    temp_json_path = None

    try:
        set_status(upload_id, user_id, "processing", progress=25)
        temp_hdf5_path = download_to_temp(storage_key, ".hdf5")
        hdf5_path = Path(temp_hdf5_path)
        
        metadata, summaries = extract_file_metadata_only(hdf5_path)
        metadata_dict = {
            "filename": metadata.filename,
            "num_measurements": metadata.num_measurements,
            "has_spectra": metadata.has_spectra,
            "has_rasters": metadata.has_raster,
            "measurements_summary": summaries,
        }

        #guarantee cache hits for user
        for i in range(1, metadata.num_measurements + 1):
            meas = read_single_measurement(hdf5_path, i)
            if meas:
                cache_measurement(upload_id=upload_id, measurement_id=i, measurement=meas)
        
        set_status(upload_id, user_id, "processing", progress=85)  

        save_parse_result(upload_id=upload_id, metadata=metadata_dict, measurements=storage_key, result_storage_key=storage_key)

    except Exception as e:
        print(f"Something happened while parsing the file with upload id-{upload_id}: {e}")
        traceback.print_exc()
    finally:
        # delete temporary file
        if temp_hdf5_path and os.path.exists(temp_hdf5_path):
            try:
                os.remove(temp_hdf5_path)
            except Exception as e:
                print(f"Failed to delete temporary HDF5 file: {e}")
        try:
            set_status(upload_id, user_id, "parsed", progress=100)  
        except Exception as e:
            print(f"Failed to update status for upload id-{upload_id}: {e}")
        



