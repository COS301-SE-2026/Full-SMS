from pathlib import Path

from fastapi import HTTPException

from api.models.analysis_models import GetMappedIRFReq, MapIRFReq
from api.services.hdf5_services import read_irf
from api.services.storage_service import download_to_temp
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
    print(f"\n\n\n{payload}\n\n\n")
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
    
def get_mapped_irf_controller(payload: GetMappedIRFReq):
    measurement_id = payload.measurement_id if payload.measurement_id is not None else -1

    mapping = (supabaseClient.table("irf_mappings")
                .select("irf_id")
                .eq("workspace_id", payload.workspace_id)
                .eq("dataset_ref", payload.dataset_ref)
                .eq("measurement_id", measurement_id)
                .eq("channel", payload.channel)
                .maybe_single()
                .execute())

    # If not found and this was a specific measurement, fall back to wildcard (-1)
    if not mapping.data and measurement_id != -1:
        mapping = (supabaseClient.table("irf_mappings")
                    .select("irf_id")
                    .eq("workspace_id", payload.workspace_id)
                    .eq("dataset_ref", payload.dataset_ref)
                    .eq("measurement_id", -1)
                    .eq("channel", payload.channel)
                    .maybe_single()
                    .execute())

    if not mapping.data:
        raise HTTPException(status_code=404, detail="No IRF mapping found for this measurement/channel")

    irf_id = mapping.data["irf_id"]

    irf_record = (supabaseClient.table("workspace_irfs")
                  .select("*")
                  .eq("id", irf_id)
                  .single()
                  .execute())

    if not irf_record.data:
        raise HTTPException(status_code=404, detail="IRF record not found")

    storage_key = irf_record.data["storage_key"]
    # suffix = Path(storage_key).suffix
    # temp_path = download_to_temp(storage_key, file_extension=suffix)

    # parsed_irf = read_irf(temp_path)
    # if not parsed_irf:
    #     raise HTTPException(status_code=500, detail="Failed to parse IRF file")

    return {
        "status": "ok",
        "irf_id": irf_id,
        "name": irf_record.data.get("name"),
        "storage_key": storage_key,
    }