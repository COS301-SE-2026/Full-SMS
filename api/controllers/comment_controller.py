from fastapi import HTTPException, status
from api.services.comment_service import list_comments


def list_comments_controller(workspace_id: str, user_id: str, upload_id: str, tab: str) -> dict:
    try:
        comments = list_comments(workspace_id, user_id, upload_id, tab)
        return {"success": True, "comments": comments}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



