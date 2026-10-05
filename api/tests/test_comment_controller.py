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

class TestListCommentsController:
    def test_returns_success(self):
        with patch(LIST_PATH, return_value=[{"id": "comment1"}]):
            from api.controllers.comment_controller import list_comments_controller
            result = list_comments_controller("workspace1", "user1", "upload1", "intensity", "m1")
        assert result == {"success": True, "comments": [{"id": "comment1"}]}

    def test_passes_measurement_id_to_service(self):
        with patch(LIST_PATH, return_value=[]) as service:
            from api.controllers.comment_controller import list_comments_controller
            list_comments_controller("workspace1", "user1", "upload1", "intensity", "m1")
        service.assert_called_once_with("workspace1", "user1", "upload1", "intensity", "m1")

    def test_measurement_id_is_optional(self):
        with patch(LIST_PATH, return_value=[]) as service:
            from api.controllers.comment_controller import list_comments_controller
            list_comments_controller("workspace1", "user1", "upload1", "intensity")
        service.assert_called_once_with("workspace1", "user1", "upload1", "intensity", None)

