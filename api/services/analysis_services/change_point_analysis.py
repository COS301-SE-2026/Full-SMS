from api.legacy.analysis.change_point import find_change_points
from api.models.analysis_models import ( CpaReq)
from api.utils.redis_Client import redisClient
import json
import numpy as np
from api.legacy.analysis.change_point import ChangePointResult


def resolve_current_measurement(payload: CpaReq) -> dict:
    print(f"\n\n\n service req: {payload}")
    upload_id = payload.upload_id
    print(f"\n\n\n UP_id: {payload.upload_id}")

    measurement_id = payload.measurement_id
    print(f"\n\n\n meas id: {payload.measurement_id}")

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    if not cached_data:
        raise ValueError("Raw data not in cache.")
    

    raw_data = json.loads(cached_data)
    print(f"\n\n\nraw data loaded\n\n\n")
    abstimes = np.array(raw_data["channel1"]["abstimes"], dtype=np.float64)
    print(f"\n\n\nabstimes\n\n\n")
    confidence = payload.confidence/100

    result = find_change_points(abstimes=abstimes, confidence=confidence)

    print(f"\n\n\n{result.num_change_points}\n\n\n")
    response = {
        "measurement_id": measurement_id,
        "num_change_points": int(result.num_change_points),
        "change_point_indices": result.change_point_indices.tolist(),
        "confidence_regions": [
            (int(start), int(end)) for start, end in result.confidence_regions
        ],
        "levels": [
            {
                "start_index": int(l.start_index),
                "end_index": int(l.end_index),
                "start_time_ns": int(l.start_time_ns),
                "end_time_ns": int(l.end_time_ns),
                "num_photons": int(l.num_photons),
                "intensity_cps": float(l.intensity_cps),
                "group_id": int(l.group_id) if l.group_id is not None else None
            }
            for l in result.levels
        ]
    }
    return response

