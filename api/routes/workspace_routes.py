from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.controllers.auth_controller import verify_token_controller
from api.controllers.workspace_controller import (
    get_workspaces_controller,
    get_workspace_controller,
    create_workspace_controller,
    update_workspace_controller,
    delete_workspace_controller,
    archive_workspace_controller,
    unarchive_workspace_controller)

from api.models.workspace import WorkspaceCreate, WorkspaceUpdate
from typing import Annotated

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])
bearer_scheme = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    result = verify_token_controller(credentials.credentials)
    return result["user"]

CurrentUser = Annotated[dict, Depends(get_current_user)]

@router.get("", summary="Get all workspaces for the current user")
def get_workspaces(current_user: CurrentUser):
    return get_workspaces_controller(current_user["id"])


@router.get("/{workspace_id}", summary="Get a specific workspace by ID")
def get_workspace(workspace_id: str, current_user: CurrentUser):
    return get_workspace_controller(workspace_id, current_user["id"])


@router.post("", summary="Create a new workspace", status_code=201)
def create_workspace(request: WorkspaceCreate, current_user: CurrentUser):
    return create_workspace_controller(request, current_user["id"])


@router.delete("/{workspace_id}", summary="Delete a workspace")
def delete_workspace(workspace_id: str, current_user: CurrentUser):
    return delete_workspace_controller(workspace_id, current_user["id"])


@router.put("/{workspace_id}", summary="Update a workspace")
def update_workspace(workspace_id: str, request: WorkspaceUpdate, current_user: CurrentUser):
    return update_workspace_controller(workspace_id, request, current_user["id"])


@router.patch("/{workspace_id}/archive", summary="Archive a workspace")
def archive_workspace(workspace_id: str, current_user: CurrentUser):
    return archive_workspace_controller(workspace_id, current_user["id"])


@router.patch("/{workspace_id}/unarchive", summary="Unarchive a workspace")
def unarchive_workspace(workspace_id: str, current_user: CurrentUser):
    return unarchive_workspace_controller(workspace_id, current_user["id"])
