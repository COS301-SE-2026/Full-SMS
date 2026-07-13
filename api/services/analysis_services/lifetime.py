from api.legacy.analysis.lifetime import fit_decay
from api.legacy.analysis.histograms import build_decay_histogram
from api.models.analysis_models import LifetimeReq, LifetimeRes
from api.services.hdf5_services import read_hdf5
from api.services.storage_service import download_to_temp
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
import json

def lifetime_analysis(payload: LifetimeReq) -> LifetimeRes:
    upload_id = payload.upload_id

    measurement_id = payload.measurement_id

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    if not cached_data:
        temp_hdf5_path = None
        storage_key=supabaseClient.table("hdf5_uploads").eq("id", upload_id).select("storage_key").execute()
        temp_hdf5_path = download_to_temp(storage_key, ".hdf5")

        read_result = read_hdf5(temp_hdf5_path)
        result_metadata: dict = read_result["metadata"]
        print(f"\n\nParsed metadata: {result_metadata}\n\n")
        result_measurements = read_result["measurements"] # returns a list of dicts!!

        #save data to cache before compressing and sending to supabase
        #
        for measurement_data in result_measurements:
            measurement_id= measurement_data.get("id")
            key= f"raw_data:{upload_id}:{measurement_id}"
            redisClient.set(key, json.dumps(measurement_data))
            
        cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    raw_data = json.loads(cached_data)
    microtimes = raw_data["channel1"]["microtimes"]
    channel_width = raw_data["channelWidth"]

    time_bins, histogram= build_decay_histogram(microtimes=microtimes,channelwidth=channel_width),

    fit_curve, fit_params = None, None
    if payload.fitting_model:
        fit_curve, fit_params = fit_decay(t=time_bins, counts=histogram, channelwidth=channel_width)

    res_data= {
    "time_bins": time_bins.tolist(),
    "histogram": histogram.tolist(),
    "fit_curve": fit_curve.tolist(),
    "fit_params": fit_params
    }

    response: LifetimeRes = LifetimeRes(**res_data)
    return response




