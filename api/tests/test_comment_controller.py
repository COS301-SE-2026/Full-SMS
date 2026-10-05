import pytest 
from unittest.mock import patch 
from fastapi import HTTPException

from api.models.comment import CommentCreate

LIST_PATH = "api.controllers.comment_controller.list_comments"
ADD_PATH = "api.controllers.comment_controller.add_comment"

def _request(**overrides):
    data = {
        "upload_id":"upload1",
        "tab": "intensity",
        "content": "This is a comment",
        "measurement_id": "m1",
        "anchor_x": 1.5,
        "anchor_y": 2.5,
    }

    data.update(overrides)
    return CommentCreate(**data)

