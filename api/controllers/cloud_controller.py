

from fastapi import HTTPException

from api.models.user import OneDriveUploadPayload
from api.services.cloud_service import get_onedrive_token, onedrive_upload_service


def get_onedrive_token_controller(user_id):

    try:
        return get_onedrive_token(user_id);
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")
    
    
def onedrive_upload_controller(payload: OneDriveUploadPayload, user_id: str):
    return onedrive_upload_service(user_id=user_id, file_name=payload.filename, workspace_id=payload.workspace_id, file_id=payload.file_id)