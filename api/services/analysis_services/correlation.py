

import json
from typing import Any

import numpy as np

from api.legacy.analysis.correlation import CorrelationResult, calculate_g2, rebin_correlation
from api.models.analysis_models import CorrelationReq, RebinCorrelationReq
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement


def get_correlation_result(params: CorrelationReq) -> dict[str, Any]:
    """Calculate second-order correlation function g2(tau).

    Computes the cross-correlation between photon arrival times from two
    detection channels. The correlation is symmetric around tau=0, with
    channel 1 defined as the "start" channel.

    The algorithm merges both channels into a single sorted time stream,
    then for each photon finds all cross-channel coincidences within the
    correlation window.

    Args:
        abstimes1: Absolute arrival times for channel 1 in nanoseconds.
        abstimes2: Absolute arrival times for channel 2 in nanoseconds.
        microtimes1: TCSPC micro times for channel 1 in nanoseconds.
        microtimes2: TCSPC micro times for channel 2 in nanoseconds.
        window_ns: Correlation window size in nanoseconds. Events with
            |tau| > window are excluded. Default 500 ns.
        binsize_ns: Histogram bin size in nanoseconds. Default 0.5 ns.
        difftime_ns: Time offset between channels (ch1 - ch2) in nanoseconds.
            Use to correct for cable delays between TCSPC cards. Default 0.

    Returns:
        CorrelationResult containing:
        - tau: Bin centers in nanoseconds
        - g2: Correlation histogram (counts per bin)
        - events: Raw delay times for potential rebinning"""
        
        
    print(f"{params}")
    upload_id = params.upload_id
    measurement_id = params.measurement_id
    print(upload_id)
    print(measurement_id)
    
    
    measurement = get_cached_measurement(upload_id=upload_id, measurement_id=measurement_id)
    
    if not measurement:
        measurement = cache_fallback_service(upload_id=upload_id, measurement_id=measurement_id)
    
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


def get_rebin(params: RebinCorrelationReq) -> dict[str,Any]:
    """Rebin a correlation result with different parameters.

    Uses the stored raw events to create a new histogram without
    recalculating the correlation.

    Args:
        result: Original correlation result.
        new_binsize_ns: New bin size in nanoseconds.
        new_window_ns: New window size. If None, uses original window.

    Returns:
        New CorrelationResult with rebinned histogram.
    """
    
    new_window_ns = params.new_window_ns
    if new_window_ns is None:
        new_window_ns = params.result["window_ns"]

    typed_result = CorrelationResult(
        tau=params.result["tau"],
        g2=params.result["g2"],
        events=params.result["events"],
        window_ns=params.result["window_ns"],
        binsize_ns=params.result["binsize_ns"],
        num_photons_ch1= params.result["num_photons_ch1"],
        num_photons_ch2= params.result["num_photons_ch2"]
    )
    new_result = rebin_correlation(typed_result, params.new_binsize_ns,new_window_ns)
    
    print(new_result)
    print("new result above")
    return {
        "tau": np.array(new_result.tau).tolist(),
        "g2": np.array(new_result.g2).tolist(),
        "events": np.array(new_result.events).tolist(),
        "window_ns": new_result.window_ns,
        "binsize_ns": new_result.binsize_ns,
        "num_photons_ch1": new_result.num_photons_ch1,
        "num_photons_ch2": new_result.num_photons_ch2,
        "num_events": typed_result.num_events,
        "measurement_id": params.result["measurement_id"]
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
