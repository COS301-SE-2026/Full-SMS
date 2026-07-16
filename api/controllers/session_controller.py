#setting up the sessions controller
from fastapi import HTTPException
from api.models.session import SessionCreate
from api.services.session_service import save_session, get_sessions, get_session_by_id


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
   
#implementing the handle_get_session_by_id() function
def handle_get_session_by_id(session_id:str,user_id:str)->dict:
    try:
        result = get_session_by_id(session_id,user_id)
        if not result:
            raise HTTPException(status_code=404,detail="Session not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))

