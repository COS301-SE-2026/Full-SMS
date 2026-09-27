from fastapi import HTTPException, status
from api.services.notification_service import (
    list_notifications,
    read_status,
)


def list_notifications_controller(user_id: str) -> dict:
    try:
        notifications = list_notifications(user_id)
        return {"success": True, "notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def read_status_controller(notification_id: str, user_id: str) -> dict:
    try:
        notification = read_status(notification_id, user_id)
        return {"success": True, "notification": notification}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
