from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File

from api.controllers.cloud_controller import get_onedrive_token_controller, onedrive_upload_controller
from api.models.user import OneDriveUploadPayload
from api.routes.profile_routes import get_current_user

router = APIRouter(prefix="/cloud", tags=["cloud"])

@router.get("/onedrive/token")
def get_onedrive_token(current_user: Annotated[dict, Depends(get_current_user)]):
    return get_onedrive_token_controller(current_user["user"]["id"])

@router.post("/upload/onedrive", summary="Upload and process file from OneDrive")
def upload_from_onedrive(payload: OneDriveUploadPayload, current_user:  Annotated[dict, Depends(get_current_user)], background_tasks: BackgroundTasks):
    return onedrive_upload_controller(payload=payload, user_id= current_user["user"]["id"],background_tasks=background_tasks)