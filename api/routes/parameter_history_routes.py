from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from api.controllers.auth_controller import verify_token_controller


from api.models.workspace import WorkspaceCreate, WorkspaceUpdate
from typing import Annotated

router = APIRouter(prefix="/workspaces", tags=["Parameter History"])
bearer_scheme = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    result = verify_token_controller(credentials.credentials)
    return result["user"]

CurrentUser = Annotated[dict, Depends(get_current_user)] 