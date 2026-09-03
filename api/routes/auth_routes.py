from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from api.controllers.auth_controller import link_onedrive_controller, verify_token_controller
from api.models.user import OneDriveCode
from api.routes.profile_routes import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

bearer_scheme = HTTPBearer()


@router.post("/verify-token", summary="Verify Supabase JWT Token")
def verify_token_endpoint(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """Verify token sent from frontend (Supabase)"""
    return verify_token_controller(credentials.credentials)



@router.post('/onedrive', summary="OneDrive Authorization")
def one_drive_auth(req: OneDriveCode, current_user: Annotated[dict, Depends(get_current_user)]):
    print(current_user)
    return link_onedrive_controller(req, current_user["user"]["id"])