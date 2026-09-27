from fastapi import HTTPException, status
from api.services.comment_service import list_comments
from api.models.comment import CommentCreate
from api.services.comment_service import add_comment

def list_comments_controller(workspace_id: str, user_id: str, upload_id: str, tab: str) -> dict:
    try:
        comments = list_comments(workspace_id, user_id, upload_id, tab)
        return {"success": True, "comments": comments}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


def add_comment_controller(workspace_id: str, request: CommentCreate, user_id: str) -> dict:
    try:
        comment=add_comment(
            workspace_id=workspace_id, 
            user_id=user_id,
            upload_id=request.upload_id,
            tab=request.tab,
            content=request.content, 
            measurement_id=request.measurement_id,
            anchor_x=request.anchor_x,
            anchor_y=request.anchor_y,
        )      
        return {"success": True, "comment": comment}
    except ValueError as valueError:
        raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail=str(valueError))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
