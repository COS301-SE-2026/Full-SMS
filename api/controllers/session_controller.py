#setting up the sessions controller
from fastapi import HTTPException
from models.session import SessionCreate
from services.session_service import save_session, get_sessions, get_session_by_id


#implementing the handle_save_session() function
def handle_save_session(user_id:str,session:SessionCreate)->dict:
    try:
        result = save_session(user_id,session)
        return result
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))

#implementing the handle_get_sessions function
def handle_get_sessions(user_id:str)->list:
    try:
        result = get_sessions(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))


