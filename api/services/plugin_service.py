import os
import uuid
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from api.services.plugin_marketplace_service import get_marketplace_plugin_by_id


SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def get_supabase_admin() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Supabase URL or Service Key is not set in environment variables."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _fetch_marketplace_versions(
    supabase: Client, source_ids: List[str]
) -> Dict[str, str]:
    if not source_ids:
        return {}

    response = (
        supabase.table("marketplace_plugins")
        .select("source_plugin_id, version")
        .in_("source_plugin_id", source_ids)
        .execute()
    )

    return {item["source_plugin_id"]: item["version"] for item in response.data or []}


def _add_available_version(plugin: dict, marketplace_versions: Dict[str, str]) -> None:
    source_id = plugin.get("source_plugin_id")
    if not source_id or source_id not in marketplace_versions:
        plugin["available_version"] = None
        return

    marketplace_version = marketplace_versions[source_id]
    plugin["available_version"] = (
        marketplace_version if marketplace_version != plugin.get("version") else None
    )


def get_user_plugins(user_id: str) -> List[dict]:
    supabase = get_supabase_admin()
    response = (
        supabase.table("user_plugins")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    plugins = response.data or []
    source_ids = [p["source_plugin_id"] for p in plugins if p.get("source_plugin_id")]
    marketplace_versions = _fetch_marketplace_versions(supabase, source_ids)

    for plugin in plugins:
        _add_available_version(plugin, marketplace_versions)

    return plugins


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


def _validate_config(config: Optional[Dict[str, Any]]) -> None:
    if config is not None:
        outputs = config.get("outputs")
        if not outputs or len(outputs) < 1:
            raise ValueError("Plugin must have at least one output type")


def _validate_script(script: Optional[str]) -> None:
    if script is not None and (not script or len(script.strip()) < 1):
        raise ValueError("Plugin script cannot be empty")


def _get_field_updates(
    plugin: dict,
    name: Optional[str],
    description: Optional[str],
    version: Optional[str],
    config: Optional[Dict[str, Any]],
    script: Optional[str],
) -> dict:
    update_data = {}

    if name is not None and name.strip() != plugin.get("name"):
        update_data["name"] = name.strip()

    if description is not None:
        new_desc = description.strip() if description else None
        if new_desc != plugin.get("description"):
            update_data["description"] = new_desc

    if version is not None and version != plugin.get("version"):
        update_data["version"] = version

    if config is not None and config != plugin.get("config"):
        update_data["config"] = config

    if script is not None and script != plugin.get("script"):
        update_data["script"] = script

    return update_data


def _reset_marketplace_status_if_rejected(plugin: dict, update_data: dict) -> None:
    if plugin.get("marketplace_status") in ("rejected", "approved"):
        update_data["marketplace_status"] = None
        update_data["review_feedback"] = None
        update_data["reviewed_at"] = None
        update_data["reviewed_by"] = None
        update_data["submitted_at"] = None


def update_plugin(
    plugin_id: str,
    user_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    version: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
    script: Optional[str] = None,
) -> dict:
    _validate_config(config)
    _validate_script(script)

    supabase = get_supabase_admin()
    plugin = get_plugin_by_id(plugin_id, user_id)

    if not plugin:
        raise ValueError("Plugin not found")

    update_data = _get_field_updates(plugin, name, description, version, config, script)

    if not update_data:
        return plugin

    _reset_marketplace_status_if_rejected(plugin, update_data)

    response = (
        supabase.table("user_plugins")
        .update(update_data)
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise RuntimeError("Failed to update plugin or plugin not found")

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


def update_installed_plugin(plugin_id: str, user_id: str) -> dict:
    supabase = get_supabase_admin()
    plugin = get_plugin_by_id(plugin_id, user_id)

    source_plugin_id = plugin.get("source_plugin_id")
    if not source_plugin_id:
        raise ValueError("this plugin wasnt installed from the marketplace")

    marketplace_plugin = get_marketplace_plugin_by_id(source_plugin_id)

    update_data = {
        "name": marketplace_plugin["name"],
        "description": marketplace_plugin.get("description"),
        "version": marketplace_plugin["version"],
        "config": marketplace_plugin["config"],
        "script": marketplace_plugin["script"],
    }

    response = (
        supabase.table("user_plugins")
        .update(update_data)
        .eq("id", plugin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise RuntimeError("failed to update plugin")

    return get_plugin_by_id(plugin_id, user_id)
