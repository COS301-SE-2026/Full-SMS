from fastapi import APIRouter, BackgroundTasks, Depends
from typing import Annotated
from api.models.export_request import ExportRequest
from api.controllers.export_controller import handle_export
from api.routes.profile_routes import get_current_user

router = APIRouter(prefix= "/export", tags=["export"])

@router.post("/")
async def export_data(request: ExportRequest, background_tasks: BackgroundTasks, current_user: Annotated[dict, Depends(get_current_user)]):
    return await handle_export(request, background_tasks, current_user["user"]["id"])