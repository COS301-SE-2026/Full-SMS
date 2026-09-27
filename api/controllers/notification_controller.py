from fastapi import HTTPException, status
from api.services.notification_service import list_notifications


def list_notifications_controller(user_id: str) -> dict:
    try:
        notifications = list_notifications(user_id)
        return {"success": True, "notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
