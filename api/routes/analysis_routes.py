from fastapi import APIRouter
from api.models.analysis_models import (Intensity_Req, Intensity_Res, Lifetime_Req, Lifetime_Res)
from api.controllers.analysis_controller import intensity_analysis_controller

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/intensity", response_model=Intensity_Res)
async def get_intensity_trace(req: Intensity_Req):
    """Generate an intensity trace."""
    return await intensity_analysis_controller(req)
