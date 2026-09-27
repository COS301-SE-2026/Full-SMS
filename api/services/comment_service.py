from typing import List
from api.services.workspace_service import (
    get_workspace_by_id,
    get_supabase_admin,
)

def list_comments(workspace_id:str, user_id: str, upload_id: str, tab:str) -> List[dict]:
    get_workspace_by_id(workspace_id, user_id)
    supabase = get_supabase_admin()

    response = (
        supabase.table("comments")
        .select("*")
        .eq("workspace_id", workspace_id)
        .eq("upload_id", upload_id)
        .eq("tab", tab)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data or []