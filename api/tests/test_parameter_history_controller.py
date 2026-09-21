import pytest 
from unittest.mock import patch 
from fastapi import HTTPException

PATH = "api.controllers.parameter_history_controller.list_history"

class TestListHistoryController:

    def test_returnsSuccess(self):
        with patch(PATH, return_value=[{"id": "h1"}]):
            from api.controllers.parameter_history_controller import list_history_controller
            result = list_history_controller("ws1", "user1", "u1", "intensity")
        assert result == {"success": True, "history": [{"id": "h1"}]}