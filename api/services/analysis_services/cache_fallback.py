from api.services.hdf5_services import read_hdf5
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
from api.services.storage_service import download_to_temp
import json

def cache_fallback_service(upload_id: str ):
    temp_hdf5_path = None
    get_storage_key = supabaseClient.table("hdf5_uploads").select("storage_key").eq("id", upload_id).execute()
    storage_key = get_storage_key.data[0]['storage_key']
    temp_hdf5_path = download_to_temp(storage_key, ".hdf5")

    read_result = read_hdf5(temp_hdf5_path)
    result_metadata: dict = read_result["metadata"]
    print(f"\n\nParsed metadata: {result_metadata}\n\n")
    result_measurements = read_result["measurements"] # returns a list of dicts!!

    #save data to cache
    #
    for measurement_data in result_measurements:
        measurement_id= measurement_data.get("id")
        key= f"raw_data:{upload_id}:{measurement_id}"
        redisClient.set(key, json.dumps(measurement_data))
        
    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    return cached_data