from fastapi import HTTPException
from api.models.analysis_models import Intensity_Req, Intensity_Res
from api.services.analysis_services.intensity import intensity_analysis

async def intensity_analysis_controller(req: Intensity_Req) -> Intensity_Res:
    """
    Controller for Intensity analysis
    Connects HTTP/Websocket requests into calls to the Intensity analysis service
    """

    try:
        response =  await intensity_analysis(req)
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not complete Intsity Analysis: {e}")
