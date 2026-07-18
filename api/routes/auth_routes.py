from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from api.controllers.auth_controller import verify_token_controller

router = APIRouter(prefix="/auth", tags=["Authentication"])

bearer_scheme = HTTPBearer()


@router.post("/verify-token", summary="Verify Supabase JWT Token")
def verify_token_endpoint(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """Verify token sent from frontend (Supabase)"""
    return verify_token_controller(credentials.credentials)