
from fastapi import HTTPException
from api.services.support_service import send_email

def handle_send_email(user_email:str, message:str)->dict:
    try:
        result = send_email(user_email, message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))
