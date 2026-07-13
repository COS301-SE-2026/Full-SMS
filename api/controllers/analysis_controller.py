from fastapi import HTTPException
from api.models.analysis_models import ClusteringReq, CpaReq, IntensityReq, IntensityRes
from api.services.analysis_services.clustering import execute_clustering
from api.services.analysis_services.clustering_job_service import clustering_job
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.change_point_analysis import resolve_current_measurement
from celery.result import AsyncResult
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

##Clustering/Grouping
def init_clustering_analysis_controller(req: ClusteringReq):
    """
    Controller for starting the clustering job, sending it to the celery task queue
    """
    try:
        job = clustering_job.delay(req.levels)
        return {"task_id": job.id, "status": "executing"}
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