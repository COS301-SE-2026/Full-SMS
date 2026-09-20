from fastapi import HTTPException, status
from api.services.parameter_history_service import(
    list_history,
    add_history_entry,
)
from api.models.parameter_history import HistoryEntryCreate


def list_historyController(workspace_id: str, user_id: str, upload_id: str, tab: str) -> dict:
    try:
        history = list_history(workspace_id, user_id, upload_id, tab)
        return {"success": True, "history": history}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))