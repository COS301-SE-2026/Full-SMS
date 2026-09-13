from fastapi import APIRouter, Depends
from typing import Annotated
from api.routes.profile_routes import get_current_user
from api.controllers.session_controller import handle_save_session, handle_get_sessions, handle_get_session_by_id
from api.models.session import SessionCreate

session_router = APIRouter(prefix="/sessions",tags=["sessions"])

@session_router.post("/")
def save_session(session:SessionCreate, current_user: Annotated[dict, Depends(get_current_user)]):
    user_id = current_user["user"]["id"]
    return handle_save_session(user_id,session)

@session_router.get("/")
def get_sessions(current_user: Annotated[dict, Depends(get_current_user)]):
    user_id = current_user["user"]["id"]
    return handle_get_sessions(user_id)

@session_router.get("/{session_id}")
def get_session_by_id(session_id:str, current_user: Annotated[dict, Depends(get_current_user)]):
    user_id = current_user["user"]["id"]
    return handle_get_session_by_id(session_id,user_id)




