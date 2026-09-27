from typing import List
from api.services.workspace_service import get_supabase_admin


def list_notifications(user_id: str) -> List[dict]:
    supabase = get_supabase_admin()

    response = (
        supabase.table("notifications")
        .select("*")
        .eq("recipient_id", user_id)
        .eq("created_at", desc=True)
        .execute()
    )
    return response.data or []