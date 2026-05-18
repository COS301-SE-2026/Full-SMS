# middlewares
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.services.auth_service import verify_token

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency that protects any route requiring authentication.
 
    Extracts the Bearer token from the Authorization header,
    verifies it against the Supabase JWT secret, and returns
    the decoded user payload.
 
    Usage on any protected route:
        @router.get("/protected")
        def protected(current_user: dict = Depends(get_current_user)):
            return {"user_id": current_user["sub"]}
 
    Raises 401 if the token is missing, expired, or invalid.
    """
    try:
        payload = verify_token(credentials.credentials)
        return payload
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )