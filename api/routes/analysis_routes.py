from fastapi import APIRouter
from api.legacy.models.group import ClusteringResult
from api.models.analysis_models import (ClusteringReq, CpaReq, IntensityReq, IntensityRes, LifetimeReq, LifetimeRes)
from api.controllers.analysis_controller import (clustering_analysis_controller, intensity_analysis_controller, change_point_analysis_controller)
from api.legacy.analysis.change_point import ChangePointResult


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

@router.post("/group-current", response_model=ClusteringResult)
def get_clustering_levels(req: ClusteringReq):
    return clustering_analysis_controller(req)