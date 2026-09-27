from fastapi import APIRouter
from api.models.comment import CommentCreate
from api.controllers.comment_controller import(
    add_comment_controller,
    list_comments_controller,
)
from api.routes.parameter_history_routes import CurrentUser

router= APIRouter(prefix="/workspaces", tags=["Comments"])

@router.get("/{workspace_id}/comments", summary="List comments")
def list_comments_route(workspace_id: str, upload_id: str, tab: str, current_user: CurrentUser):
    return list_comments_controller(workspace_id, current_user["id"], upload_id, tab)


@router.get("/{workspace_id}/comments", summary="Add a comment", status_code=201)
def add_comment_route(workspace_id: str, request: CommentCreate, current_user: CurrentUser):
    return add_comment_controller(workspace_id, request, current_user["id"])

