import os
import uuid
from typing import List, Optional
from supabase import Client, create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def get_supabase_admin() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Supabase URL or Service Key is not set in environment variables.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_workspaces(user_id: str) -> List[dict]:
    supabase = get_supabase_admin()
    response = supabase.rpc(
        "get_workspaces_with_file_count",
        {"p_user_id": user_id}
    ).execute()

    return response.data or []


def get_workspace_by_id(workspace_id: str, user_id: str) -> Optional[dict]:
    supabase = get_supabase_admin()
    response = (
        supabase.table("workspaces")
        .select("*, workspace_files(count)")
        .eq("id", workspace_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not response.data:
        raise ValueError("Workspace not found")

    data = response.data

    file_count = 0
    if "workspace_files" in data and len(data["workspace_files"]) > 0:
        file_count = data["workspace_files"][0].get("count", 0)

    return {
        "id": data["id"],
        "user_id": data["user_id"],
        "name": data["name"],
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
        return get_workspace_by_id(workspace_id, user_id)

    response = (
        supabase.table("workspaces")
        .update(update_data)
        .eq("id", workspace_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Workspace not found or update failed.")

    return response.data[0]


def delete_workspace(workspace_id: str, user_id: str) -> bool:
    supabase = get_supabase_admin()

    workspace = get_workspace_by_id(workspace_id, user_id)

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
        raise ValueError("Workspace not found")

    return True


def archive_workspace(workspace_id: str, user_id: str) -> dict:
    return update_workspace(workspace_id, user_id, workspace_status="archived")


def unarchive_workspace(workspace_id: str, user_id: str) -> dict:
    return update_workspace(workspace_id, user_id, workspace_status="active")

def get_workspace_uploads(workspace_id: str, user_id: str) -> dict:
    supabase = get_supabase_admin()
    response = (supabase.table("hdf5_uploads")
                .select("*")
                .eq("workspace_id", workspace_id)
                .eq("user_id", user_id)
                .execute()
                )
    return response.data