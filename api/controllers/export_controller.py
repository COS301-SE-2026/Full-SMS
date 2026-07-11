import os
from pathlib import Path
from fastapi import HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from api.models.export_request import ExportRequest
from api.services import export_service

async def handle_export(request: ExportRequest, background_tasks: BackgroundTasks, user_id: str):
    if not any([request.export_intensity, request.export_levels, request.export_groups]):
        raise HTTPException(status_code = 400, detail= "No export category selected.")
    
    try:
        output_path = export_service.export_data(request, user_id)
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")
    
    background_tasks.add_task(os.remove, output_path)
    return FileResponse(
        path=output_path,
        filename=Path(output_path).name,
        media_type="application/octet-stream",
    )
