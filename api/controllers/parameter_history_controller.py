from fastapi import HTTPException, status
from api.services.parameter_history_service import(
    list_history,
    add_history_entry,
    revert_history_entry,
)
from api.models.parameter_history import HistoryEntryCreate


def list_history_controller(workspace_id: str, user_id: str, upload_id: str, tab: str) -> dict:
    try:
        history = list_history(workspace_id, user_id, upload_id, tab)
        return {"success": True, "history": history}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def add_history_controller(workspace_id: str, request: HistoryEntryCreate, user_id: str) -> dict:
    try:
        entry=add_history_entry(
            workspace_id=workspace_id, 
            user_id=user_id,
            upload_id=request.upload_id,
            tab=request.tab,
            parameter=request.parameter, 
            new_value=request.new_value,
            old_value=request.old_value,
            measurement_id=request.measurement_id
        )      
        return {"success": True, "entry": entry}
    except ValueError as valueError:
        raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail=str(valueError))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def revert_history_controller(workspace_id: str, entry_id: str, user_id: str) -> dict:
    try:
        entry = revert_history_entry(workspace_id, user_id, entry_id)
        return {"success": True, "entry": entry}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


    