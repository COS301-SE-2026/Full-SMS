from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool
from api.models.comment import CommentCreate
from api.controllers.comment_controller import(
    add_comment_controller,
    list_comments_controller,
)
from api.controllers.auth_controller import verify_token_controller
from api.services.workspace_service import user_can_access_workspace
from api.utils.comment_hub import comment_hub
from api.routes.parameter_history_routes import CurrentUser

router= APIRouter(prefix="/workspaces", tags=["Comments"])

@router.get("/{workspace_id}/comments", summary="List comments")
def list_comments_route(workspace_id: str, upload_id: str, tab: str, current_user: CurrentUser, measurement_id: str | None = None):
    return list_comments_controller(workspace_id, current_user["id"], upload_id, tab, measurement_id)


@router.post("/{workspace_id}/comments", summary="Add a comment", status_code=201)
async def add_comment_route(workspace_id: str, request: CommentCreate, current_user: CurrentUser):
    result = await run_in_threadpool(add_comment_controller, workspace_id, request, current_user["id"])

    try:
        await comment_hub.broadcast(
            workspace_id,
            {"type": "comment_added", "comment": result["comment"]},
        )
    except Exception as e:
        print(f"Failed to broadcast comment for workspace {workspace_id}: {e}")

    return result


@router.websocket("/{workspace_id}/comments/live")
async def comments_live_route(websocket: WebSocket, workspace_id: str, token: str):
    try:
        auth = await run_in_threadpool(verify_token_controller, token)
        user_id = auth["user"]["id"]
        allowed = await run_in_threadpool(user_can_access_workspace, workspace_id, user_id)
    except Exception:
        await websocket.close(code=4401)
        return

    if not allowed:
        await websocket.close(code=4403)
        return

    await comment_hub.join(workspace_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        comment_hub.leave(workspace_id, websocket)
