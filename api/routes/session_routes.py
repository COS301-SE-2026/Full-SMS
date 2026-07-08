from fastapi import APIRouter
from controllers.session_controller import handle_save_session, handle_get_sessions, handle_get_session_by_id
from models.session import SessionCreate

session_router = APIRouter(prefix="/sessions",tags=["sessions"])





