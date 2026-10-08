import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from supabase import Client, create_client
from api.services.storage_service import BUCKET
from api.utils.redis_Client import redisClient
from api.services.profile_service import get_user_profile
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
WORKSPACE_NOT_FOUND = "Workspace not found"
WORKSPACE_UPDATE_FAILED = "Workspace not found or update failed"


def get_supabase_admin() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Supabase URL or Service Key is not set in environment variables.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_workspaces(user_id: str) -> List[dict]:
    supabase = get_supabase_admin()

    response = (
        supabase.table("workspaces")
        .select("*")
        .or_(f"user_id.eq.{user_id},member_ids.cs.{{{user_id}}}")
        .execute()
    )

    workspaces = response.data or []

    for workspace in workspaces:
        file_count_response = (
            supabase.table("hdf5_uploads")
            .select("id", count="exact")
            .eq("workspace_id", workspace["id"])
            .execute()
        )
        workspace["file_count"] = file_count_response.count or 0

    return workspaces


def get_workspace_by_id(workspace_id: str, user_id: str) -> Optional[dict]:
    supabase = get_supabase_admin()

    if not user_can_access_workspace(workspace_id, user_id):
        raise ValueError(WORKSPACE_NOT_FOUND)

    response = (
            supabase.table("workspaces")
            .select("*")
            .eq("id", workspace_id)
            .single()
            .execute()
        )

    if not response.data:
        raise ValueError(WORKSPACE_NOT_FOUND)

    data = response.data

    file_count_response = (
        supabase.table("hdf5_uploads")
        .select("id", count="exact")
        .eq("workspace_id", workspace_id)
        .execute()
    )
    file_count = file_count_response.count or 0

    return {
        "id": data["id"],
        "user_id": data["user_id"],
        "is_owner": data["user_id"] == user_id,
        "name": data["name"],
        "member_ids": data["member_ids"],
        "description": data["description"],
        "storage_bucket_path": data["storage_bucket_path"],
        "status": data["status"],
        "created_at": data["created_at"],
        "updated_at": data["updated_at"],
        "file_count": file_count, }


def create_workspace(user_id: str, name: str, description: Optional[str] = None) -> dict:
    supabase = get_supabase_admin()

    if not name or len(name.strip()) < 3:
        raise ValueError("Workspace name must be at least 3 characters long.")

    workspace_id = str(uuid.uuid4())
    storage_path = f"workspaces/{user_id}/{workspace_id}/"

    workspace_data = {
        "id": workspace_id,
        "user_id": user_id,
        "name": name.strip(),
        "description": description.strip() if description else None,
        "storage_bucket_path": storage_path,
        "status": "active",
    }

    response = supabase.table("workspaces").insert(workspace_data).execute()

    if not response.data:
        raise RuntimeError("Failed to create workspace.")

    result = response.data[0]
    result["file_count"] = 0
    return result


def update_workspace(workspace_id: str, user_id: str, name: Optional[str] = None, description: Optional[str] = None, workspace_status: Optional[str] = None) -> dict:
    supabase = get_supabase_admin()

    update_data = {}
    if name is not None:
        if len(name.strip()) < 3:
            raise ValueError(
                "Workspace name must be at least 3 characters long.")
        update_data["name"] = name.strip()

    if description is not None:
        update_data["description"] = description.strip(
        ) if description else None

    if workspace_status is not None:
        if workspace_status not in ["active", "archived"]:
            raise ValueError(
                "Invalid workspace status. Must be 'active' or 'archived'.")
        update_data["status"] = workspace_status

   
    if not update_data:
        workspace = get_workspace_by_id(workspace_id, user_id)
        if workspace["user_id"] != user_id:
            raise ValueError(WORKSPACE_NOT_FOUND)
        return workspace

    response = (
        supabase.table("workspaces")
        .update(update_data)
        .eq("id", workspace_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise ValueError(WORKSPACE_UPDATE_FAILED)

    return response.data[0]


def delete_workspace(workspace_id: str, user_id: str) -> bool:
    supabase = get_supabase_admin()

    workspace = get_workspace_by_id(workspace_id, user_id)

    if workspace["user_id"] != user_id:
        raise ValueError(WORKSPACE_NOT_FOUND)
    
    if workspace.get("storage_bucket_path"):
        try:
            files = supabase.storage.from_(
                "spectroscopy-files").list(workspace["storage_bucket_path"])
            if files:
                file_paths = [
                    f"{workspace['storage_bucket_path']}{f['name']}" for f in files
                ]
                if file_paths:
                    supabase.storage.from_(
                        "spectroscopy-files").remove(file_paths)
        except Exception as e:
            raise RuntimeError(
                f"Failed to delete files in storage bucket: {str(e)}")

    response = (
        supabase.table("workspaces")
        .delete()
        .eq("id", workspace_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise ValueError(WORKSPACE_NOT_FOUND)

    return True


def archive_workspace(workspace_id: str, user_id: str) -> dict:
    return update_workspace(workspace_id, user_id, workspace_status="archived")


def unarchive_workspace(workspace_id: str, user_id: str) -> dict:
    return update_workspace(workspace_id, user_id, workspace_status="active")

def touch_workspace(workspace_id: str) -> None:
    supabase = get_supabase_admin()
    supabase.table("workspaces").update({"updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", workspace_id).execute()


def get_workspace_uploads(workspace_id: str, user_id: str) -> dict:
    supabase = get_supabase_admin()

    get_workspace_by_id(workspace_id, user_id)

    response = (supabase.table("hdf5_uploads")
                .select("*")
                .eq("workspace_id", workspace_id)
                .execute()
                    )
    return response.data

def delete_workspace_upload(workspace_id: str, upload_id: str, user_id: str) -> dict:
    supabase = get_supabase_admin()

    record = (
        supabase.table("hdf5_uploads")
        .select("id, storage_key")
        .eq("id", upload_id)
        .eq("workspace_id", workspace_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not record.data:
        raise ValueError("Upload not found.")
    storage_key = record.data[0].get("storage_key")

    if storage_key:
        try:
            supabase.storage.from_(BUCKET).remove([storage_key])
        except Exception as e:
            print(f"Warning: Failed to delete storage file {storage_key}: {e}")

    try:
        keys = redisClient.keys(f"raw_data:{upload_id}:*")
        if keys:
            redisClient.delete(*keys)
    except Exception as e:
        print(f"Warning: Failed to delete Redis cache keys: {e}")

    supabase.table("hdf5_uploads").delete().eq("id", upload_id).eq("workspace_id", workspace_id).eq("user_id", user_id).execute()

    touch_workspace(workspace_id)

    return {"deleted": True, "upload_id": upload_id}

def add_workspace_member (workspace_id: str, user_id: str, member_id: str) -> dict:
    supabase = get_supabase_admin()

    response = (
        supabase.table("workspaces")
        .select("*")
        .eq("id", workspace_id)
        .single()
        .execute()
    )
   
    if not response.data:
        raise ValueError(WORKSPACE_NOT_FOUND)

    data = response.data

    caller_owner = user_id == data["user_id"]
    self_add = user_id == member_id

    if not (caller_owner or self_add):
        raise ValueError("Permission denied")
    
    members = data["member_ids"]
    is_owner = member_id == data["user_id"] 
    is_member = member_id in members

    if is_owner or is_member:
        data["already_member"] = True
        return data
    else:
        members.append(member_id)
        update_data = {"member_ids": members}
        response = (
                supabase.table("workspaces")
                .update(update_data)
                .eq("id", workspace_id)
                .execute()
            )
        
    if not response.data:
        raise ValueError(WORKSPACE_UPDATE_FAILED)
    
    result = response.data[0]
    result["already_member"] = False
    return result

def remove_workspace_member(workspace_id: str, user_id: str, member_id: str) -> dict:
    supabase = get_supabase_admin()
    response = (
        supabase.table("workspaces")
        .select("*")
        .eq("id", workspace_id)
        .single()
        .execute()
    )

    if not response.data:
        raise ValueError(WORKSPACE_NOT_FOUND)

    data = response.data
    members = data["member_ids"]

    is_owner = user_id == data["user_id"]
    is_self_remove = user_id == member_id

    if not (is_owner or is_self_remove):
        raise ValueError(WORKSPACE_NOT_FOUND)

    if member_id not in members:
        data["was_member"] = False
        return data

    members.remove(member_id)
    update_data = {"member_ids": members}
    response = (
        supabase.table("workspaces")
        .update(update_data)
        .eq("id", workspace_id)
        .execute()
    )

    if not response.data:
        raise ValueError(WORKSPACE_UPDATE_FAILED)

    result = response.data[0]
    result["was_member"] = True
    return result

def user_can_access_workspace(workspace_id: str, user_id: str) -> bool:
    supabase = get_supabase_admin()
    response = (
        supabase.table("workspaces")
        .select("user_id, member_ids")
        .eq("id", workspace_id)
        .single()
        .execute()
    )

    if not response.data:
        return False

    data = response.data
    is_owner = user_id == data["user_id"]
    is_member = user_id in data["member_ids"]

    return is_owner or is_member

def get_workspace_members(workspace_id: str, user_id: str) -> list[dict]:
    supabase = get_supabase_admin()

    if not user_can_access_workspace(workspace_id, user_id):
        raise ValueError(WORKSPACE_NOT_FOUND)

    response = (
        supabase.table("workspaces")
        .select("*, workspace_files(count)")
        .eq("id", workspace_id)
        .single()
        .execute()
    )

    if not response.data:
        raise ValueError(WORKSPACE_NOT_FOUND)

    data = response.data

    members_owners_list = list(set([data["user_id"]] + data["member_ids"]))

    results = []
    
    for member_id in members_owners_list:
        try:
            user_profile = get_user_profile(member_id)
        except ValueError:
            continue
        results.append(user_profile)
    return results



