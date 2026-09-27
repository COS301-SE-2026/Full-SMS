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

def add_comment(workspace_id: str, user_id: str, upload_id: str, tab: str, content:str, measurement_id: str | None = None, anchor_x: float | None = None, anchor_y: float| None = None) -> dict:
    get_workspace_by_id(workspace_id, user_id)

    supabase = get_supabase_admin()
    
    row = {
        "workspace_id": workspace_id,
        "upload_id": upload_id,
        "measurement_id": measurement_id,
        "tab": tab,
        "content": content,
        "anchor_x": anchor_x,
        "anchor_y": anchor_y,
        "author_id": user_id,
        
    }

    response = supabase.table("comments").insert(row).execute()
