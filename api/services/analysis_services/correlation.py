

import json
from typing import Any

import numpy as np

from api.legacy.analysis.correlation import calculate_g2
from api.models.analysis_models import CorrelationReq
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement


def get_correlation_result(params: CorrelationReq) -> dict[str, Any]:
    print(f"{params}")
    upload_id = params.upload_id
    measurement_id = params.measurement_id
    print(upload_id)
    print(measurement_id)
    
    
    measurement = get_cached_measurement(upload_id=upload_id, measurement_id=measurement_id)
    
    # if not measurement:
    #     measurement = cache_fallback_service(upload_id=upload_id, measurement_id=measurement_id)
    
    if isinstance(measurement, str):
        measurement = json.loads(measurement) 
    if isinstance(measurement, dict):
        abstimes1 =  np.array(measurement.channel1.abstimes, dtype=np.float64)
        abstimes2 =  np.array(measurement.channel2.abstimes, dtype=np.float64)
        microtimes1 =  np.array(measurement.channel1.microtimes, dtype=np.float64)
        microtimes2 =  np.array(measurement.channel2.microtimes, dtype=np.float64)

    else:
        print("\n\n\n\n\nELSE\n\n\n\n\n")
        abstimes1 =  measurement.channel1.abstimes
        abstimes2 =  measurement.channel2.abstimes
        microtimes1 =  measurement.channel1.microtimes
        microtimes2 =  measurement.channel2.microtimes
    
    window_ns = params.window_ns
    binsize_ns = params.binsize_ns
    difftime_ns = params.difftime_ns
    
    result = calculate_g2(
        abstimes1=abstimes1,
        abstimes2=abstimes2,
        microtimes1=microtimes1,
        microtimes2=microtimes2,
        window_ns=window_ns,
        binsize_ns=binsize_ns,
        difftime_ns=difftime_ns,
    )
    
    return {
        "tau": result.tau.tolist(),
        "g2": result.g2.tolist(),
        "events": result.events.tolist(),
        "window_ns": result.window_ns,
        "binsize_ns": result.binsize_ns,
        "num_photons_ch1": result.num_photons_ch1,
        "num_photons_ch2": result.num_photons_ch2,
        "num_events": result.num_events ,
        "measurement_id": params.measurement_id
    }
    

test_measurement = {
    "upload_id" : "02881aed-2a8d-496b-8052-d1258ac33515",
    "measurement_id": "1",
    "window_ns":   500.0,
    "binsize_ns":   0.5,
    "difftime_ns":  0.0
}

def test_correlation():
   result = get_correlation_result(test_measurement)
#    print(result)
   print(f"DONE!: \n num_events: {result["num_events"]} \n num_photons_ch1: {result["num_photons_ch1"]} \n num_photons_ch2: {result["num_photons_ch2"]}")