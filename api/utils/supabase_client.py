from fastapi import HTTPException
from supabase import Client, create_client
import os
from dotenv import load_dotenv

load_dotenv()  

supabaseClient: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)