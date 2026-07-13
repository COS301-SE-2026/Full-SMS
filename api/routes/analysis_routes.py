from fastapi import APIRouter
from api.legacy.models.group import ClusteringResult
from api.models.analysis_models import (ClusteringReq, CpaReq, IntensityReq, IntensityRes, LifetimeReq, LifetimeRes)
from api.controllers.analysis_controller import (init_clustering_analysis_controller, intensity_analysis_controller, change_point_analysis_controller)
from api.legacy.analysis.change_point import ChangePointResult
from api.controllers.analysis_controller import init_clustering_analysis_controller, get_clustering_job_status


router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/intensity", response_model=IntensityRes)
def get_intensity_trace(req: IntensityReq):
    """Generate an intensity trace."""
    print(f"\n\n\n{req}\n\n\n\n")
    return intensity_analysis_controller(req)

@router.post("/change-point-analysis")
def get_change_points(req: CpaReq):
    print(f"\n\n\nRoute REQ: {req}")
    return change_point_analysis_controller(req)

@router.get("/grouping/{task_id}")
def get_clustering_status(task_id:str):
    return get_clustering_job_status(task_id=task_id)

@router.post("/grouping")
def init_clustering(req: ClusteringReq):
    return init_clustering_analysis_controller(req=req)

# @router.post("/group-current", response_model=ClusteringResult)
# def get_clustering_levels(req: ClusteringReq):
#     return clustering_analysis_controller(req)

