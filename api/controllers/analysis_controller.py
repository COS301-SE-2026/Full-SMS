from dataclasses import asdict
from celery.result import AsyncResult
from fastapi import HTTPException
from api.models.analysis_models import ClusteringReq, CpaReq, IntensityReq, IntensityRes, RasterScanReq
from api.services.analysis_services.clustering_job_service import clustering_job
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.change_point_analysis import resolve_current_measurement
from api.services.analysis_services.lifetime import fluorescence_decay, lifetime_fitting
from api.services.analysis_services.raster_scan import get_raster_scan_data
from api.services.analysis_services.spectra import get_spectra_data

## intensity analysis
def intensity_analysis_controller(req: IntensityReq) -> IntensityRes:
    """
    Controller for Intensity analysis
    Connects HTTP/Websocket requests into calls to the Intensity analysis service
    """
    try:
        response = intensity_analysis(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str({e}))
    
def change_point_analysis_controller(req: CpaReq):
    """
    The function returns a ChangePointResult object. The property you need for graphing is result.levels, which is a list of LevelData objects.
    """
    print(f"\n\n\nCPA conroller req: {req}")
    try:
        response = resolve_current_measurement(req)
        return response
    except Exception:
        raise HTTPException(status_code=500, detail=str("Could not complete Change Point Analysis:"))

def get_raster_scan_controller(req: RasterScanReq):
    try:
        response = get_raster_scan_data(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

##Clustering/Grouping
def init_clustering_analysis_controller(req: ClusteringReq):
    """
    Controller for starting the clustering job, sending it to the celery task queue
    """
    try:
        json_serializable_levels = [asdict(levels) for levels in req.levels]
        job = clustering_job.delay(json_serializable_levels)
        return {"task_id": job.id, "status": "executing"}
    
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not queue job: {str(e)}")

    
def get_clustering_job_status(task_id: str):
    """
    Let's the rest of the sysytem knoe when a job is compelete
    """
    try:
        job = AsyncResult(task_id)
        if job.ready() :
            if job.successful():
                return {"status": "completed", "result": job.result}
            else:
                return {"status": "failed", "error": str(job.result)}
        return {"status":"processing"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
##spectra
def get_spectra_data_controller(req):
    """
    returns spectral data for the plotting of the spectral trace
    """
    try:
        response = get_spectra_data(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

##lifetime
def get_lifetime_controller(req: LifetimeReq):
    try:
        response = lifetime_fitting(req)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def get_decay_controller(req):
    try:
        print(f"{req}")
        response = fluorescence_decay(req)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))