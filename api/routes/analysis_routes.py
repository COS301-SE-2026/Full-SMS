from fastapi import APIRouter
from pydantic import BaseModel
from api.models.analysis_models import (ClusteringReq, CpaReq, IntensityReq, IntensityRes, LifetimeReq, RasterScanReq)
from api.controllers.analysis_controller import (get_clustering_job_status, get_decay_controller, get_lifetime_controller, get_spectra_data_controller, init_clustering_analysis_controller, intensity_analysis_controller, change_point_analysis_controller, get_raster_scan_controller)


router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/intensity", response_model=IntensityRes)
def get_intensity_trace(req: IntensityReq):
    """Generate an intensity trace."""
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

class LifetimePayload(BaseModel):
    upload_id: str
    measurement_id: str
    bin_size_ms: float

@router.post("/lifetime/fit")
def get_lifetime(req: LifetimeReq):
    return get_lifetime_controller(req)

@router.post("/lifetime")
def get_lifetime(req: LifetimePayload):
    print(f"ROUte: {req}")
    return get_decay_controller(req)