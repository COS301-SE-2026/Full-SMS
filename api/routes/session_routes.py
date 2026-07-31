from fastapi import APIRouter
from api.controllers.session_controller import handle_save_session, handle_get_sessions, handle_get_session_by_id
from api.models.session import SessionCreate

session_router = APIRouter(prefix="/sessions",tags=["sessions"])


@session_router.post("/")
def save_session(session:SessionCreate,user_id:str):
    return handle_save_session(user_id,session)

@session_router.get("/")
def get_sessions(user_id:str):
    return handle_get_sessions(user_id)

@session_router.get("/{session_id}")
def get_session_by_id(session_id:str,user_id:str):
    return handle_get_session_by_id(session_id,user_id)




