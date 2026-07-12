from fastapi import APIRouter
from api.models.analysis_models import (CpaReq, IntensityReq, IntensityRes, LifetimeReq, LifetimeRes)
from api.controllers.analysis_controller import (intensity_analysis_controller, change_point_analysis_controller)
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