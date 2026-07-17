from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.controllers.auth_controller import verify_token_controller
from api.controllers.plugin_controller import (
    get_user_plugins_controller,
    get_plugin_by_id_controller,
    create_plugin_controller,
    update_plugin_controller,
    toggle_plugin_controller,
    delete_plugin_controller,)
from api.models.plugin import PluginCreate, PluginUpdate, PluginToggle

router = APIRouter(prefix="/plugins", tags=["Plugins"])
bearer_scheme = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    result = verify_token_controller(credentials.credentials)
    return result["user"]


@router.get("", summary="Get all plugins for the current user")
def get_plugins(current_user: dict = Depends(get_current_user)):
    return get_user_plugins_controller(current_user["id"])


@router.get("/{plugin_id}", summary="Get a specific plugin by id")
def get_plugin(plugin_id: str, current_user: dict = Depends(get_current_user)):
    return get_plugin_by_id_controller(plugin_id, current_user["id"])


@router.post("", summary="Create a new plugin", status_code=201)
def create_plugin(request: PluginCreate, current_user: dict = Depends(get_current_user)):
    return create_plugin_controller(request, current_user["id"])


@router.put("/{plugin_id}", summary="Update a plugin")
def update_plugin(plugin_id: str, request: PluginUpdate, current_user: dict = Depends(get_current_user)):
    return update_plugin_controller(plugin_id, request, current_user["id"])


@router.patch("/{plugin_id}/toggle", summary="Toggle a plugin's active status")
def toggle_plugin(plugin_id: str, request: PluginToggle, current_user: dict = Depends(get_current_user)):
    return toggle_plugin_controller(plugin_id, request, current_user["id"])


@router.delete("/{plugin_id}", summary="Delete a plugin")
def delete_plugin(plugin_id: str, current_user: dict = Depends(get_current_user)):
    return delete_plugin_controller(plugin_id, current_user["id"])
