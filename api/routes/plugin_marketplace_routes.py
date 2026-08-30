from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.controllers.auth_controller import verify_token_controller
from api.controllers import plugin_marketplace_controller

router = APIRouter(prefix="/plugins", tags=["Plugin Marketplace"])
bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    result = verify_token_controller(credentials.credentials)
    return result["user"]

CurrentUser = Annotated[dict, Depends(get_current_user)]

@router.post("/{plugin_id}/submit", summary="Submit a plugin for marketplace review")
def submit_marketplace_plugin(plugin_id: str, current_user: CurrentUser):
    return plugin_marketplace_controller.submit_marketplace_plugin_controller(plugin_id, current_user["id"])

@router.post("/{plugin_id}/cancel-submission", summary="Cancel a plugin submission for marketplace review")
def cancel_plugin_submission(plugin_id: str, current_user: CurrentUser):
    return plugin_marketplace_controller.cancel_plugin_submission_controller(plugin_id, current_user["id"])

@router.get("/marketplace", summary="Get all plugins that were approved for the marketplace")
def get_marketplace_plugins():
    return plugin_marketplace_controller.get_marketplace_plugins_controller()

@router.get("/marketplace/{plugin_id}", summary="Get a specific plugin from the marketplace")
def get_marketplace_plugin_by_id(plugin_id: str):
    return plugin_marketplace_controller.get_marketplace_plugin_by_id_controller(plugin_id)

@router.post("/marketplace/{plugin_id}/install", summary="install a plugin from the marketplace")
def install_marketplace_plugin(plugin_id: str, current_user: CurrentUser):
    return plugin_marketplace_controller.install_marketplace_plugin_controller(plugin_id, current_user["id"])

@router.get("/{plugin_id}/submission-details", summary="Get the submission details of a plugin")
def get_plugin_submission_details(plugin_id: str, current_user: CurrentUser):
    return plugin_marketplace_controller.get_plugin_submission_details_controller(plugin_id, current_user["id"])