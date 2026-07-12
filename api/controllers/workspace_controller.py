from fastapi import HTTPException, status
from api.services.workspace_service import (
    create_workspace,
    get_user_workspaces,
    get_workspace_by_id,
    get_workspace_uploads,
    update_workspace,
    delete_workspace,
    archive_workspace,
    unarchive_workspace
)
from api.models.workspace import WorkspaceCreate, WorkspaceUpdate


def get_workspaces_controller(user_id: str):
    try:
        workspaces = get_user_workspaces(user_id)
        return {"success": True, "workspaces": workspaces}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def get_workspace_controller(workspace_id: str, user_id: str):
    try:
        workspace = get_workspace_by_id(workspace_id, user_id)
        return {"success": True, "workspace": workspace}
    except ValueError as valerror:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def create_workspace_controller(request: WorkspaceCreate, user_id: str) -> dict:
    try:
        workspace = create_workspace(
            name=request.name, description=request.description, user_id=user_id)
        return {"success": True, "message": "Workspace created successfully", "workspace": workspace}
    except ValueError as valerror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def update_workspace_controller(workspace_id: str, request: WorkspaceUpdate, user_id: str) -> dict:
    try:
        workspace = update_workspace(
            workspace_id=workspace_id,
            user_id=user_id,
            name=request.name,
            description=request.description,
            status=request.status
        )
        return {"success": True, "message": "Workspace updated successfully", "workspace": workspace}
    except ValueError as valerror:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def delete_workspace_controller(workspace_id: str, user_id: str) -> dict:
    try:
        delete_workspace(workspace_id, user_id)
        return {"success": True, "message": "Workspace deleted successfully"}
    except ValueError as valerror:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def archive_workspace_controller(workspace_id: str, user_id: str) -> dict:
    try:
        workspace = archive_workspace(workspace_id, user_id)
        return {"success": True, "message": "Workspace archived successfully", "workspace": workspace}
    except ValueError as valerror:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def unarchive_workspace_controller(workspace_id: str, user_id: str) -> dict:
    try:
        workspace = unarchive_workspace(workspace_id, user_id)
        return {"success": True, "message": "Workspace unarchived successfully", "workspace": workspace}
    except ValueError as valerror:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

def get_workspace_uploads_controller(workspace_id: str, user_id: str) -> dict:
    try:
        response = get_workspace_uploads(workspace_id=workspace_id, user_id=user_id)
        return {"success": True, "message": "Worspace uploads found successfullt", "uploads": response}
    except ValueError as valerror:
        raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))