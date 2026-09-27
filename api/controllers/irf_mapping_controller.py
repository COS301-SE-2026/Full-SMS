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

    if response.data is None:
         raise HTTPException(status_code=404, detail="No IRFs found for this workspace")
     
    return {
        "status": "ok",
        "data": response.data
    }
    
def create_irf_mapping(payload: MapIRFReq):
    """
    Create an association between dataset/measurement/channel and irf
    """
    print (payload is dict)
    response = (supabaseClient
                .table("irf_mappings")
                .upsert(
                    {
                    "irf_id": payload.irf_id,
                    "workspace_id": payload.workspace_id,
                    "dataset_ref": payload.dataset_ref,
                    "measurement_id": payload.measurement_id if payload.measurement_id is not None else -1,
                    "channel": payload.channel
                    },
                    on_conflict="dataset_ref,measurement_id,channel"
                )
                .select("*")
                .execute())
    
    print(response)
    
    return {
        "status" : "ok",
        "data" : response
    }

def get_irf_mappings(payload: dict):
    
    print(f"\n\n\n{payload}\n\n\n")

    
    response = (supabaseClient
                .table("irf_mappings")
                .select("*")
                .eq("workspace_id", payload["workspace_id"])
                .eq("dataset_ref", payload["dataset_ref"])
                .execute()
                )
    
    print(f"\n\n\n{response}\n\n\n")
    
    if(response.data ==[]):
         raise HTTPException(status_code=404, detail="No IRF mappings found for this workspace")
    
    
    
    return {
        "status": "ok",
        "data": response
    }
    
def delete_irf_mapping(payload: MapIRFReq):
    measurement_id = payload.measurement_id if payload.measurement_id is not None else -1
    
    response = (supabaseClient
                .table("irf_mappings")
                .delete()
                .eq("workspace_id", payload.workspace_id)
                .eq("dataset_ref", payload.dataset_ref)
                .eq("measurement_id", measurement_id)
                .eq("channel", payload.channel)
                .execute())
    
    if(response.data ==[]):
        raise HTTPException(status_code=404, detail="No IRF mappings found for this workspace")
    
    return {
        "status": "ok",
        "data": response
    } 