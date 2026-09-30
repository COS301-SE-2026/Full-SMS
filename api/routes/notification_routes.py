from fastapi import APIRouter
from api.controllers.notification_controller import (list_notifications_controller, read_status_controller, decline_invite_controller,accept_invite_controller,)
from api.routes.parameter_history_routes  import CurrentUser

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", summary="List notifications")
def list_notifications_route(current_user: CurrentUser):
    return list_notifications_controller(current_user["id"])

@router.post("/{notification_id}/read", summary="Mark notification as read")
def read_status_route(notification_id: str, current_user: CurrentUser):
    return read_status_controller(notification_id, current_user["id"])

@router.post("/{notification_id}/decline", summary="Decline a workspace invite")
def decline_invite_route(notification_id: str, current_user: CurrentUser):
    return decline_invite_controller(notification_id, current_user["id"])

@router.post("/{notification_id}/accept", summary="Accept a workspace invite")
def accept_invite_route(notification_id: str, current_user: CurrentUser):
    return accept_invite_controller(notification_id, current_user["id"])
