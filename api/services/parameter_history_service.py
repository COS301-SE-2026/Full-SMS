from typing import List
from api.services.workspace_service import (
    get_workspace_by_id,
    get_supabase_admin,
)

def list_history(workspace_id:str, user_id: str, upload_id: str, tab:str, limit:int =100) -> List[dict]:
    get_workspace_by_id(workspace_id, user_id)
    supabase = get_supabase_admin()

    response = (
        supabase.table("parameter_history")
        .select("*")
        .eq("workspace_id", workspace_id)
        .eq("upload_id", upload_id)
        .eq("tab", tab)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []

def add_historyEntry(workspace_id: str, user_id: str, upload_id: str, tab: str, parameter:str, new_value, old_value=None, measurement_id: str | None = None) -> dict:
    get_workspace_by_id(workspace_id, user_id)

    supabase = get_supabase_admin()
    
    row = {
        "workspace_id": workspace_id,
        "upload_id": upload_id,
        "measurement_id": measurement_id,
        "tab": tab,
        "parameter": parameter,
        "old_value": old_value,
        "new_value": new_value,
        "author_id": user_id,
        
    }
    
    response = supabase.table("parameter_history").insert(row).execute()
    return response.data[0]