import os
from datetime import datetime, timezone
from typing import List, Optional
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def get_supabase_admin() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Supabase URL or Service Key is not set in environment variables."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def submit_marketplace_plugin(plugin_id: str, user_id: str) -> dict:
    supabase = get_supabase_admin()
    response = (
        supabase.table("user_plugins")
        .select("*")
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not response.data:
        raise ValueError("Plugin not found")

    plugin = response.data

    if plugin.get("marketplace_status") in ["pending_review", "approved"]:
        raise ValueError("Plugin is already submitted for approval")

    update_response = (
        supabase.table("user_plugins")
        .update(
            {
                "marketplace_status": "pending_review",
                "submitted_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not update_response.data:
        raise RuntimeError("Failed to submit plugin for review")

    return update_response.data[0]


def get_marketplace_plugins() -> List[dict]:
    supabase = get_supabase_admin()
    response = (
        supabase.table("marketplace_plugins")
        .select(
            "id, source_plugin_id, owner_id, name, description, version, config, created_at, updated_at, approved_at"
        )
        .order("approved_at", desc=True)
        .execute()
    )
    plugins = []
    for plugin in response.data or []:
        plugins.append(
            {
                "id": plugin["source_plugin_id"],
                "name": plugin["name"],
                "description": plugin["description"],
                "version": plugin["version"],
                "config": plugin["config"],
                "user_id": plugin["owner_id"],
                "created_at": plugin["created_at"],
                "updated_at": plugin["updated_at"],
                "approved_at": plugin["approved_at"],
            }
        )

    return plugins


def get_marketplace_plugin_by_id(plugin_id: str) -> Optional[dict]:
    supabase = get_supabase_admin()
    response = (
        supabase.table("marketplace_plugins")
        .select("*")
        .eq("source_plugin_id", plugin_id)
        .single()
        .execute()
    )
    if not response.data:
        raise ValueError("Plugin not found")
    plugin = response.data
    return {
        "id": plugin["source_plugin_id"],
        "name": plugin["name"],
        "description": plugin["description"],
        "version": plugin["version"],
        "config": plugin["config"],
        "script": plugin["script"],
        "user_id": plugin["owner_id"],
        "created_at": plugin["created_at"],
        "updated_at": plugin["updated_at"],
    }


def get_plugins_in_review() -> List[dict]:
    supabase = get_supabase_admin()

    response = (
        supabase.table("user_plugins")
        .select("*")
        .eq("marketplace_status", "pending_review")
        .order("submitted_at", desc=False)
        .execute()
    )

    return response.data or []


def get_all_marketplace_plugins() -> List[dict]:
    supabase = get_supabase_admin()

    response = (
        supabase.table("user_plugins")
        .select("*")
        .is_("marketplace_status", "not.null")
        .order("updated_at", desc=True)
        .execute()
    )

    return response.data or []


def cancel_plugin_submission(plugin_id: str, user_id: str) -> dict:
    supabase = get_supabase_admin()
    response = (
        supabase.table("user_plugins")
        .select("*")
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not response.data:
        raise ValueError("Plugin not found")

    plugin = response.data

    if plugin.get("marketplace_status") != "pending_review":
        raise ValueError(
            "Plugin is only allowed to cancel submission if it is pending review"
        )

    update_response = (
        supabase.table("user_plugins")
        .update(
            {
                "marketplace_status": None,
                "submitted_at": None,
                "reviewed_at": None,
                "reviewed_by": None,
                "review_feedback": None,
            }
        )
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not update_response.data:
        raise RuntimeError("Failed to cancel plugin submission")
    return update_response.data[0]


def approve_plugin_submission(
    plugin_id: str, admin_id: str, feedback: Optional[str] = None
) -> dict:
    supabase = get_supabase_admin()
    response = (
        supabase.table("user_plugins")
        .select("*")
        .eq("id", plugin_id)
        .single()
        .execute()
    )
    if not response.data:
        raise ValueError("Plugin not found")

    plugin = response.data

    if response.data.get("marketplace_status") != "pending_review":
        raise ValueError("Plugin is not pending review")

    update_response = (
        supabase.table("user_plugins")
        .update(
            {
                "marketplace_status": "approved",
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_by": admin_id,
                "review_feedback": feedback,
            }
        )
        .eq("id", plugin_id)
        .execute()
    )

    if not update_response.data:
        raise RuntimeError("Failed to approve plugin submission")

    _save_to_marketplace(plugin, admin_id)

    return update_response.data[0]


def reject_plugin_submission(plugin_id: str, admin_id: str, feedback: str) -> dict:
    if feedback is None or len(feedback.strip()) == 0:
        raise ValueError("Feedback is required when you reject a plugin submission")

    supabase = get_supabase_admin()

    response = (
        supabase.table("user_plugins")
        .select("*")
        .eq("id", plugin_id)
        .single()
        .execute()
    )
    if not response.data:
        raise ValueError("Plugin not found")
    plugin = response.data

    if plugin.get("marketplace_status") != "pending_review":
        raise ValueError("Plugin is not pending review")

    update_response = (
        supabase.table("user_plugins")
        .update(
            {
                "marketplace_status": "rejected",
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_by": admin_id,
                "review_feedback": feedback,
            }
        )
        .eq("id", plugin_id)
        .execute()
    )

    if not update_response.data:
        raise RuntimeError("Failed to reject plugin submission")
    return update_response.data[0]


def get_reviewer_info(reviewer_id: str) -> Optional[dict]:
    supabase = get_supabase_admin()
    try:
        response = supabase.auth.admin.get_user_by_id(reviewer_id)
        if not response.user:
            return None
        return {"email": response.user.email}
    except Exception as error:
        print(f"Error fetching reviewer info: {error}")
        return None


def _save_to_marketplace(plugin: dict, admin_id: str) -> None:
    """Save or update the approved plugin snapshot in marketplace_plugins table."""
    supabase = get_supabase_admin()

    marketplace_data = {
        "source_plugin_id": plugin["id"],
        "owner_id": plugin["user_id"],
        "name": plugin["name"],
        "description": plugin.get("description"),
        "version": plugin["version"],
        "config": plugin["config"],
        "script": plugin["script"],
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "approved_by": admin_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    existing = (
        supabase.table("marketplace_plugins")
        .select("id")
        .eq("source_plugin_id", plugin["id"])
        .execute()
    )

    if existing.data and len(existing.data) > 0:
        supabase.table("marketplace_plugins").update(marketplace_data).eq(
            "source_plugin_id", plugin["id"]
        ).execute()
    else:
        supabase.table("marketplace_plugins").insert(marketplace_data).execute()
