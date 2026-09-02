import hashlib
import os
import uuid

from fastapi import HTTPException
import httpx

from api.services import hdf5_job_service
from api.services.storage_service import build_storage_key
from  api.utils.supabase_client import supabaseClient

def get_onedrive_token(userID: str):
    response = supabaseClient.table("user_integrations").select("refresh_token").eq("user_id", userID).eq("provider", "onedrive").execute()
    
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
def onedrive_upload_service(user_id: str, file_id: str, file_name: str, workspace_id: str):
    token_data = get_onedrive_token(user_id)
    access_token = token_data["access_token"]
    
    graph_api_url = f"https://graph.microssoft.com/v1.0.me/drive/items/{file_id}/content"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    with httpx.Client(follow_redirects=True, timeout= 60) as client:
        response = client.get(graph_api_url, headers=headers)
        if response.status_code !=200:
            raise HTTPException(status_code=400, detail="Failed to download file from OneDrive")
        
        file = res.content
        
        size_bytes = len(file)
        
        # hashes and upload_ids are generated server side when upload comes from a cloud storage service
        sha256_hash = hashlib.sha256(file).hexdigest()
        upload_id = str(uuid.uuid4())
        storage_key = build_storage_key(user_id=user_id, upload_id=upload_id, file_name=file_name)
        
        supabaseClient.storage.from_(BUCKET).upload(
            path=storage_key,
            file=file,
            file_options={"content-type": "application/x-hdf5"}
        )
        
        upload_record = supabaseClient.table("hdf5_uploads").insert({
            "user_id": user_id,
            "filename": filename,
            "workspace_id": workspace_id,
            "size_bytes": size_bytes,
            "storage_key": storage_key,
            "sha256": sha256_hash,
            "status": "uploaded",
            "progress": 0
        }).execute
        
        hdf5_job_service.enqueue_parse(upload_id, user_id, storage_key)
        
        return {
            "status":"success",
            "upload_id":upload_id,
            "filename": file_name
        }