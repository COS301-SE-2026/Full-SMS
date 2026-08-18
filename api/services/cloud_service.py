import os

from fastapi import HTTPException
import httpx

from  api.utils.supabase_client import supabaseClient

def get_onedrive_token(userID: str):
    response= supabaseClient.table("user_integrations").select("refresh_token").eq("user_id", userID).eq("provider", "onedrive").execute()
    refresh_token = response.data[0]["refresh_token"]
    
    if not refresh_token:
        raise HTTPException(status_code=404, detail="User refresh token not found.")
    
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
    