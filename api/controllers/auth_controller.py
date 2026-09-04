# controllers
from fastapi import Depends, HTTPException, status
from api.models.user import OneDriveCode
from api.services.auth_service import link_onedrive, verify_token

def verify_token_controller(token: str) -> dict:
    """
    Controller layer - calls service and returns clean response.
    """
    try:
        payload = verify_token(token)
        return{
            "valid": True,
            "user":{
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role","authenticated"),
                "app_metadata": payload.get("app_metadata", {}),
            },
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
        
def link_onedrive_controller(payload: OneDriveCode, user_id: str):
    """
    Authorizes link to OneDrive account
    """
    try:
        return link_onedrive(payload, user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange token: {e}")