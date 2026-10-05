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

    def test_workspace_not_found(self):
        with patch(LIST_PATH, side_effect=ValueError("Workspace not found")):
            from api.controllers.comment_controller import list_comments_controller
            with pytest.raises(HTTPException) as exc:
                list_comments_controller("workspace1", "user1", "upload1", "intensity", "m1")
        assert exc.value.status_code == 404

    def test_service_failure(self):
        with patch(LIST_PATH, side_effect=RuntimeError("Unexpected failure")):
            from api.controllers.comment_controller import list_comments_controller
            with pytest.raises(HTTPException) as exc:
                list_comments_controller("workspace1", "user1", "upload1", "intensity", "m1")
        assert exc.value.status_code == 500

class TestAddCommentController:
    def test_returns_success(self):
        with patch(ADD_PATH, return_value={"id": "comment1"}):
            from api.controllers.comment_controller import add_comment_controller
            result = add_comment_controller("workspace1", _request(), "user1")
        assert result == {"success": True, "comment": {"id": "comment1"}}

    def test_passes_request_fields_to_services(self):
        with patch(ADD_PATH, return_value={"id": "comment1"}) as service:
            from api.controllers.comment_controller import add_comment_controller
            add_comment_controller("workspace1", _request(), "user1")

        service.assert_called_once_with(
            workspace_id="workspace1",
            user_id="user1",
            upload_id="upload1",
            tab="intensity",
            content="This is a comment",
            measurement_id="m1",
            anchor_x=1.5,
            anchor_y=2.5
        )

    def test_page_level_comment_passes_none_for_measurement_and_positions(self):
        with patch(ADD_PATH, return_value={"id": "comment1"}) as service:
            from api.controllers.comment_controller import add_comment_controller
            request = _request(tab="correlation",measurement_id=None, anchor_x=None, anchor_y=None)
            add_comment_controller("workspace1", request, "user1")

        keyword_arguments = service.call_args.kwargs
        assert keyword_arguments["measurement_id"] is None
        assert keyword_arguments["anchor_x"] is None
        assert keyword_arguments["anchor_y"] is None

    def test_workspace_not_found(self):
        with patch(ADD_PATH, side_effect=ValueError("Workspace not found")):
            from api.controllers.comment_controller import add_comment_controller
            with pytest.raises(HTTPException) as exc:
                add_comment_controller("workspace1", _request(), "user1")
        assert exc.value.status_code == 404

