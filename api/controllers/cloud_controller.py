

from fastapi import BackgroundTasks, HTTPException

from api.models.user import OneDriveUploadPayload
from api.services.cloud_service import get_onedrive_token, onedrive_upload_service
from api.services.hdf5_upload_service import create_upload_record


def get_onedrive_token_controller(user_id):

    try:
        return get_onedrive_token(user_id);
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")
    
    
def onedrive_upload_controller(payload: OneDriveUploadPayload, user_id: str, background_tasks:BackgroundTasks):
    
    upload_record = create_upload_record(user_id=user_id, filename=payload.filename, workspace_id=payload.workspace_id, size_bytes=1, sha256="")
    upload_id = upload_record["id"]
    storage_key = upload_record["storage_key"]
    
    background_tasks.add_task(
        onedrive_upload_service,
        user_id=user_id,
        upload_id=upload_id,
        storage_key=storage_key,
        file_id=payload.file_id,
        file_name=payload.filename,
        workspace_id=payload.workspace_id
    )
    
    # return upload_id for progress tracking 
    return {
        "status": "started",
        "upload_id": upload_id,
        "filename": payload.filename
    }