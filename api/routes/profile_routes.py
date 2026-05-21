from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from controllers.auth_controller import verify_token_controller
from controllers.profile_controller import get_profile_controller, update_profile_controller
from models.user import UpdateProfileRequest

router = APIRouter(prefix="/profile", tags=["Profile"])
bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    return verify_token_controller(credentials.credentials)

@router.get("/me", summary="Get current user profile")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return get_profile_controller(current_user["user"]["id"])

@router.put("/me", summary="Update current user profile")
def update_my_profile(request: UpdateProfileRequest, current_user: dict = Depends(get_current_user)) :
    return update_profile_controller(current_user["user"]["id"], request)