from fastapi import APIRouter
from api.models.analysis_models import (IntensityReq, IntensityRes, LifetimeReq, LifetimeRes)
from api.controllers.analysis_controller import intensity_analysis_controller

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/intensity", response_model=IntensityRes)
def get_intensity_trace(req: IntensityReq):
    """Generate an intensity trace."""
    print(f"\n\n\n{req}\n\n\n\n")
    return intensity_analysis_controller(req)

