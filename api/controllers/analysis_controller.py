from fastapi import HTTPException
from api.models.analysis_models import CpaReq, IntensityReq, IntensityRes
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.change_point_analysis import resolve_current_measurement

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
    
def change_point_analysis_controller(req: CpaReq):
    """
    The function returns a ChangePointResult object. The property you need for graphing is result.levels, which is a list of LevelData objects.
    """
    print(f"\n\n\nCPA conroller req: {req}")
    try:
        response = resolve_current_measurement(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not complete Change Point Analysis")
    