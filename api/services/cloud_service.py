import hashlib
import os
import uuid

from fastapi import HTTPException
import httpx

from api.services import hdf5_job_service
from api.services.hdf5_upload_service import create_upload_record, set_status, set_upload_progress, validate_upload_request
from api.services.storage_service import build_storage_key
from  api.utils.supabase_client import supabaseClient

def get_onedrive_token(user_id: str):
    response = supabaseClient.table("user_integrations").select("refresh_token").eq("user_id", user_id).eq("provider", "onedrive").execute()
    
    if not response.data or len(response.data) == 0 or not response.data[0].get("refresh_token"):
        raise HTTPException(status_code=404, detail="OneDrive account not linked. Please sign in.")
        
    refresh_token = response.data[0]["refresh_token"]
    
    get_token = httpx.post(
        "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "client_id": os.getenv("ONEDRIVE_CLIENT_ID"),
            "client_secret": os.getenv("ONEDRIVE_CLIENT_SECRET"),
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
    )
    
    if get_token.status_code !=200:
        raise HTTPException(status_code=401, detail="OneDrive session expired. Please sign in again.")
    
    tokens = get_token.json()
    
    return {
        "access_token": tokens["access_token"],
        "expires_in": tokens["expires_in"]
    }
    
BUCKET = os.environ.get("SUPABASE_BUCKET_NAME")  
def onedrive_upload_service(user_id: str, file_id: str, file_name: str, workspace_id: str, upload_id: str, storage_key: str):
    try:
        set_status(upload_id=upload_id, user_id=user_id, progress=25, status="downloading")
        
        token_data = get_onedrive_token(user_id)
        access_token = token_data["access_token"]
        
        graph_api_url = f"https://graph.microsoft.com/v1.0/me/drive/items/{file_id}/content"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        with httpx.Client(follow_redirects=True, timeout= 60) as client:
            response = client.get(graph_api_url, headers=headers)
            if response.status_code !=200:
                raise HTTPException(status_code=400, detail=f"{response.content}")
            
            file = response.content
            
            size_bytes = len(file)
            
            # hashes and upload_ids are generated server side when upload comes from a cloud storage service
            sha256_hash = hashlib.sha256(file).hexdigest()
            
            supabaseClient.table("hdf5_uploads").update({
                "size_bytes": size_bytes,
                "sha256": sha256_hash,
                "status": "uploading",
                "progress": 50
            }).eq("id", upload_id).execute()
                    
            supabaseClient.storage.from_(BUCKET).upload(
                path=storage_key,
                file=file,
                file_options={"content-type": "application/x-hdf5"}
            )
            
            set_status(progress=75, upload_id=upload_id, user_id=user_id, status="processing")
            
            hdf5_job_service.enqueue_parse(upload_id, user_id, storage_key)
            
    except Exception as e:
        print (f"An error occurent in the Onedrive upload service: {e}")
        supabaseClient.table("hdf5_uploads").update({
            "status": "failed",
            "err_msg": str(e)
        }).eq("id", upload_id).execute()
