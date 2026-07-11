import os
from pathlib import Path
from fastapi import HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from api.models.export_request import ExportRequest
from api.services import export_service

async def handle_export(request: ExportRequest, background_tasks: BackgroundTasks, user_id: str):
    if not any([request.export_intensity, request.export_levels, request.export_groups]):
        raise HTTPException(status_code = 400, detail= "No export category selected.")
    