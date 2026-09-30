import os 
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def get_supabase_admin() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY :
        raise RuntimeError("Supabase environment variables are not set") 
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY )


def get_user_profile(user_id: str) -> dict:
    supabase = get_supabase_admin()
    response = supabase.auth.admin.get_user_by_id(user_id)
    if not response.user :
        raise ValueError("User not found")
    user = response.user
    return {
        "id": user.id,
        "email": user.email,
        "username": user.user_metadata.get("username"),
        "role": user.user_metadata.get("role", "researcher"),
    }

def update_user_profile(user_id: str, username: str = None, new_password: str = None) -> dict:
    supabase = get_supabase_admin()
    update_data = {}
    if username:
        update_data["user_metadata"] = {"username": username}
    if new_password:
        update_data["password"] = new_password
    if not update_data:
        raise ValueError("No update data provided")
    response = supabase.auth.admin.update_user_by_id(user_id, update_data)
    if not response.user:
        raise ValueError("Failed to update user")
    user = response.user
    return {
        "id": user.id,
        "email": user.email,
        "username": user.user_metadata.get("username"),
        "role": user.user_metadata.get("role", "researcher"),
    }


def get_user_by_email(email: str) -> dict:
    supabase = get_supabase_admin()
    users = supabase.auth.admin.list_users()

    candidate_user = None
    for user in users:
        if user.email == email:
            candidate_user = user
            break

    if not candidate_user:
        raise ValueError("User not found")
    
    return {
        "id": candidate_user.id,
        "email": candidate_user.email,
        "username": candidate_user.user_metadata.get("username"),
        "role": candidate_user.user_metadata.get("role", "researcher"),
    }
    
    