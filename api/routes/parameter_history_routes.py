from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from api.controllers.auth_controller import verify_token_controller
from api.controllers.parameter_history_controller import(
    list_history_controller,
)

router = APIRouter(prefix="/workspaces", tags=["Parameter History"])
bearer_scheme = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    result = verify_token_controller(credentials.credentials)
    return result["user"]

CurrentUser = Annotated[dict, Depends(get_current_user)] 

@router.get("/{workspace_id}/history", summary="List parameter history")
def list_history_route(workspace_id: str, upload_id: str, tab: str, current_user:CurrentUser):
    return list_history_controller(workspace_id, current_user["id"], upload_id, tab)
