from fastapi import HTTPException

from api.utils.supabase_client import supabaseClient

def get_workspace_irfs(workspace_id: str, user_id: str):
    """
    Return a list of IRF available to a workspace
    """
    response = (supabaseClient.table("workspace_irfs")
                .select("*")
                .eq("",workspace_id)
                .eq("", user_id)
                )
    if response.status == 404:
        raise HTTPException(status_code=404, detail=response.error.details)
    
    if response.data == []:
         raise HTTPException(status_code=404, detail="No IRFs found for this workspace")
     
    return {
        "status": "ok",
        "data": response.data
    }
    