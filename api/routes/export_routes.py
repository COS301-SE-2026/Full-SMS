from fastapi import APIRouter, Response, File
from models.export_request import ExportRequest
from controllers.export_controller import handle_export

router = APIRouter(prefix= "/export", tags=["export"])

@router.post("/")
async def export_data(request: ExportRequest):
    return await handle_export(request)