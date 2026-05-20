from fastapi import HTTPException, status
from api.services.profile_service import get_user_profile, update_user_profile
from api.models.user import UpdateProfileRequest

def get_profile_controller(user_id: str) -> dict:
    try:
        user = get_user_profile(user_id)
        return {"success": True, "user": user}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_Internal_SERVER_ERROR,
            detail=str(e)
        )  

def update_profile_controller(user_id: str, request: UpdateProfileRequest) -> dict:
    try:
        user = update_user_profile(user_id=user_id, username=request.username, new_password=request.new_password)
        return {"success": True, "message": "Profile updated successfully", "user": user}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )  

