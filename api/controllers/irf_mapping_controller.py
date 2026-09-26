from fastapi import HTTPException

from api.models.analysis_models import MapIRFReq
from api.utils.supabase_client import supabaseClient

def get_workspace_irfs(workspace_id: str, user_id: str):
    """
    Return a list of IRF available to a workspace
    """
    response = (supabaseClient.table("workspace_irfs")
                .select("*")
                .eq("workspace_id",workspace_id)
                .eq("user_id", user_id)
                .execute()
                )
    print(response)
    
    # if response.status == 404:
    #     raise HTTPException(status_code=404, detail=response.error.details)
    
    # if response.data is None:
    #      raise HTTPException(status_code=404, detail="No IRFs found for this workspace")
     
    return {
        "status": "ok",
        "data": response.data
    }
    
def create_irf_mapping(payload: MapIRFReq):
    """
    Create an association between dataset/measurement/channel and irf
    """
    
    response = (supabaseClient
                .table("irf_mappings")
                .insert(payload.model_dump_json())
                .select()
                .execute())
    
    print(response)
    
    return {
        "status" : "ok",
        "data" : response
    }
    