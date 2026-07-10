from fastapi import HTTPException
from api.models.analysis_models import IntensityReq, IntensityRes
from api.services.analysis_services.intensity import intensity_analysis

def intensity_analysis_controller(req: IntensityReq) -> IntensityRes:
    """
    Controller for Intensity analysis
    Connects HTTP/Websocket requests into calls to the Intensity analysis service
    """
    print(f"\n\n\n\nEntering controller\n\n\n\n\n")
    print(f"\n\n\n{req}\n\n\n")
    try:
        response = intensity_analysis(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not complete Intensity Analysis: {e}")
