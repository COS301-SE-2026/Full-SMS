from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.controllers.auth_controller import verify_token_controller
from api.controllers.profile_controller import get_profile_controller, update_profile_controller
from api.models.user import UpdateProfileRequest

router = APIRouter(prefix="/profile", tags=["Profile"])
bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    return verify_token_controller(credentials.credentials)