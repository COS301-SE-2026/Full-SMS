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

def add_history_entry(workspace_id: str, user_id: str, upload_id: str, tab: str, parameter:str, new_value, old_value=None, measurement_id: str | None = None) -> dict:
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

    if not response.data:
        raise RuntimeError("Failed to record history entry.")
    
    return response.data[0]

def revert_history_entry(workspace_id: str, user_id: str, entry_id: str) -> dict:
    get_workspace_by_id(workspace_id, user_id)
    
    supabase = get_supabase_admin()
    response = (
            supabase.table("parameter_history")
            .select("*")
            .eq("id", entry_id)
            .eq("workspace_id", workspace_id)
            .execute()
        )
    if not response.data:
            raise ValueError("History entry not found.")

    original = response.data[0]

    return add_history_entry(
         workspace_id=workspace_id,
         user_id=user_id,
         upload_id=original["upload_id"],
         tab=original["tab"],
         parameter=original["parameter"],
         new_value=original["old_value"],
         old_value=original["new_value"],
         measurement_id=original["measurement_id"], 
    )