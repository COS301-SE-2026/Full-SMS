from fastapi import APIRouter
from api.legacy.models.group import ClusteringResult
from api.models.analysis_models import (ClusteringReq, CpaReq, IntensityReq, IntensityRes, LifetimeReq, LifetimeRes)
from api.controllers.analysis_controller import (get_clustering_job_status, get_spectra_data_controller, init_clustering_analysis_controller, intensity_analysis_controller, change_point_analysis_controller, get_raster_scan_controller)
from api.models.analysis_models import (CpaReq, IntensityReq, IntensityRes, LifetimeReq, LifetimeRes, RasterScanReq)
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

@router.get("/grouping/{task_id}")
def get_clustering_status(task_id:str):
    return get_clustering_job_status(task_id=task_id)

@router.post("/grouping")
def init_clustering(req: ClusteringReq):
    return init_clustering_analysis_controller(req=req)


@router.post("/raster-scan")
def get_raster_scan(req: RasterScanReq):
    return get_raster_scan_controller(req)

@router.post("/spectra")
def get_spectra_data(req: RasterScanReq):
    return get_spectra_data_controller(req)