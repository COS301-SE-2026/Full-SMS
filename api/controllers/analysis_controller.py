from fastapi import HTTPException
from api.models.analysis_models import ClusteringReq, CpaReq, IntensityReq, IntensityRes
from api.services.analysis_services.clustering import execute_clustering
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.change_point_analysis import resolve_current_measurement

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
def clustering_analysis_controller(req: ClusteringReq):
    """
    Controller for Grouping/Clustering analysis
    """
    try:
        response = execute_clustering(req)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not complete Clustering Analysis: {str(e)}")