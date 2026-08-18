from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile, File

from api.controllers.cloud_controller import get_onedrive_token_controller
from api.routes.profile_routes import get_current_user

router = APIRouter(prefix="/cloud", tags=["cloud"])

@router.post("/onedrive/token")
def get_onedrive_token(current_user: Annotated[dict, Depends(get_current_user)]):
    return get_onedrive_token_controller(current_user["user"]["id"])