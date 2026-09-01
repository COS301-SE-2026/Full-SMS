import os
import uuid
from typing import List, Optional, Dict, Any
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def get_supabase_admin() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Supabase URL or Service Key is not set in environment variables."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_plugins(user_id: str) -> List[dict]:
    supabase = get_supabase_admin()
    response = (
        supabase.table("user_plugins")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return response.data or []


def get_plugin_by_id(plugin_id: str, user_id: str) -> Optional[dict]:
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

    return response.data


def create_plugin(
    user_id: str,
    name: str,
    config: Dict[str, Any],
    script: str,
    description: Optional[str] = None,
    version: str = "1.0.0",
    source_plugin_id: Optional[str] = None,
) -> dict:
    supabase = get_supabase_admin()
    if not name or not config or not script:
        raise ValueError("plugin name is a required.")
    if not script or len(script.strip()) == 0:
        raise ValueError("plugin script is a required.")
    if not config.get("outputs") or len(config.get("outputs")) == 0:
        raise ValueError("plugin must have at least one output type")

    plugin_id = str(uuid.uuid4())

    response = (
        supabase.table("user_plugins")
        .insert(
            {
                "id": plugin_id,
                "user_id": user_id,
                "name": name.strip(),
                "description": description.strip() if description else None,
                "config": config,
                "script": script,
                "version": version,
                "enabled": True,
                "source_plugin_id": source_plugin_id,
            }
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError("Failed to create plugin")

    return response.data[0]


def update_plugin(
    plugin_id: str,
    user_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    version: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
    script: Optional[str] = None,
) -> dict:
    supabase = get_supabase_admin()
    plugin = get_plugin_by_id(plugin_id, user_id)

    if not plugin:
        raise ValueError("Plugin not found")

    update_data = {}
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if version is not None:
        update_data["version"] = version
    if config is not None:
        if not config.get("outputs") or len(config.get("outputs")) < 1:
            raise ValueError("plugin must have at least one output type")
        update_data["config"] = config
    if script is not None:
        if not script or len(script.strip()) < 1:
            raise ValueError("plugin script cant be empty")
        update_data["script"] = script

    if not update_data:
        return get_plugin_by_id(plugin_id, user_id)

    response = (
        supabase.table("user_plugins")
        .update(update_data)
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data or len(response.data) == 0:
        raise RuntimeError("Failed to update plugin or plugin nott found")

    return get_plugin_by_id(plugin_id, user_id)


def toggle_plugin(plugin_id: str, user_id: str, enabled: bool) -> dict:
    supabase = get_supabase_admin()

    response = (
        supabase.table("user_plugins")
        .update({"enabled": enabled})
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Plugin not found.")

    return get_plugin_by_id(plugin_id, user_id)


def delete_plugin(plugin_id: str, user_id: str) -> bool:
    supabase = get_supabase_admin()

    response = (
        supabase.table("user_plugins")
        .delete()
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Plugin not found.")

    return True
