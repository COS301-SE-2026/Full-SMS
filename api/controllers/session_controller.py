#setting up the sessions controller
from fastapi import HTTPException
from models.session import SessionCreate
from services.session_service import save_session, get_sessions, get_session_by_id