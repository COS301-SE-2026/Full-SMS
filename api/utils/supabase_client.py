from fastapi import HTTPException
from supabase import create_client
import os

from services import storage_service

supabaseClient = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)