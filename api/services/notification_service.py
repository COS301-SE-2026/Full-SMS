from typing import List
from api.services.workspace_service import get_supabase_admin


def list_notifications(user_id: str) -> List[dict]:
    supabase = get_supabase_admin()

    response = (
        supabase.table("notifications")
        .select("*")
        .eq("recipient_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []

def add_notification(workspace_id: str, recipient_id: str, type: str, message: str) -> dict:
    supabase = get_supabase_admin()
    
    row = {
        "workspace_id": workspace_id,
        "recipient_id": recipient_id,
        "type": type,
        "message": message,
    }

    response = supabase.table("notifications").insert(row).execute()

    if not response.data:
        raise RuntimeError("Failed to add notification.")
    
    return response.data[0]


def read_status(notification_id:str, user_id: str) -> dict:
    supabase = get_supabase_admin()

    response = (
        supabase.table("notifications")
        .update({"read" : True})
        .eq("id", notification_id)
        .eq("recipient_id", user_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Notification not found.")
    
    return response.data[0]