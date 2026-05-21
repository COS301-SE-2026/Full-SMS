# controllers
from fastapi import Depends, HTTPException, status
from services.auth_service import verify_token

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
            },
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )