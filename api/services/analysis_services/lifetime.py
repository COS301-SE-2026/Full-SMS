from api.legacy.analysis.lifetime import fit_decay
from api.legacy.analysis.histograms import build_decay_histogram
from api.models.analysis_models import Lifetime_Req, Lifetime_Res
from api.utils.redis_Client import redisClient
import json

async def lifetime_analysis(payload: Lifetime_Req) -> Lifetime_Res:

    upload_id = payload.upload_id

    try:   
        data_from_cache = redisClient.get("raw_data:{upload_id}:{payload.measurement_id}")
    except Exception as e:
        print(f"Data not found in cache: {e}")

    raw_data = json.loads(data_from_cache)
    microtimes = raw_data["channel1"]["microtimes"]
    channel_width = raw_data["channelWidth"]

    time_bins, histogram= build_decay_histogram(microtimes=microtimes,channelwidth=channel_width),

    fit_curve, fit_params = None, None
    if payload.fitting_model:
        fit_curve, fit_params = fit_decay(t=time_bins, counts=histogram, channelwidth=channel_width)

    response: Lifetime_Res = {
    "time_bins": time_bins.tolist(),
    "histogram": histogram.tolist(),
    "fit_curve": fit_curve.tolist(),
    "fit_params": fit_params
    }
    return response




