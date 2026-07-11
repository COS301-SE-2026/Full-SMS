from fastapi import APIRouter, BackgroundTasks
from api.models.export_request import ExportRequest
from api.controllers.export_controller import handle_export

router = APIRouter(prefix= "/export", tags=["export"])

@router.post("/")
async def export_data(request: ExportRequest, background_tasks: BackgroundTasks):
    return await handle_export(request, background_tasks)