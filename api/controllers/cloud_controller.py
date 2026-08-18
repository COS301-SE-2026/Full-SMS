

from fastapi import HTTPException

from api.services.cloud_service import get_onedrive_token


def get_onedrive_token_controller(user_id):
    
    try:
        return get_onedrive_token(user_id);
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")