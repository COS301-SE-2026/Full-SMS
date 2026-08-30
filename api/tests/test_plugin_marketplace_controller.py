import pytest
from unittest.mock import patch
from fastapi import HTTPException
from api.controllers import plugin_marketplace_controller

class TestSubmitMarketplacePluginController:
    @patch("api.controllers.plugin_marketplace_controller.plugin_marketplace_service")
    def test_successful_submission(self, mock_service):
        mock_service.submit_marketplace_plugin.return_value = {
            "id": "plugin123",
            "marketplace_status": "pending_review",
        }
        
        result = plugin_marketplace_controller.submit_marketplace_plugin_controller("plugin123", "kuda123")
        assert result["success"] is True
        assert result["data"]["marketplace_status"] == "pending_review"
        
    @patch("api.controllers.plugin_marketplace_controller.plugin_marketplace_service")
    def test_submission_plugin_not_found(self, mock_service):
        mock_service.submit_marketplace_plugin.side_effect = ValueError("Plugin not found")
        
        with pytest.raises(HTTPException) as exc_info:
            plugin_marketplace_controller.submit_marketplace_plugin_controller("plugin123", "kuda123")
        assert exc_info.value.status_code == 400
        assert str(exc_info.value.detail) == "Plugin not found"
        
class TestCancelPluginSubmissionController:
    @patch("api.controllers.plugin_marketplace_controller.plugin_marketplace_service")
    def test_succesful_cancellation(self, mock_service):
        mock_service.cancel_plugin_submssion.return_value = {
            "id": "plugin123",
            "marketplace_status": None,
        }
        
        result = plugin_marketplace_controller.cancel_plugin_submission_controller("plugin123", "kuda123")
        assert result["success"] is True
        assert result["message"] == "Plugin submission cancelled successfully"
        
class TestGetMarketplacePluginsController:
    @patch("api.controllers.plugin_marketplace_controller.plugin_marketplace_service")
    def test_successful_retrieval(self, mock_service):
        mock_service.get_marketplace_plugins.return_value = [
            {"id": "plugin123", "marketplace_status": "pending_review"},
            {"id": "plugin456", "marketplace_status": "approved"},
        ]
        
        result = plugin_marketplace_controller.get_marketplace_plugins_controller()
        assert result["success"] is True
        assert len(result["data"]) == 2

class TestGetMarketplacePluginByIdController:
    @patch("api.controllers.plugin_marketplace_controller.plugin_marketplace_service")
    def test_successful_retrieval(self, mock_service):
        mock_service.get_marketplace_plugin_by_id.return_value = {
            "id": "plugin123",
            "marketplace_status": "approved",
            "name": "Test Plugin"
        }
        
        result = plugin_marketplace_controller.get_marketplace_plugin_by_id_controller("plugin123")
        assert result["success"] is True
        assert result["data"]["marketplace_status"] == "approved"
        assert result["data"]["id"] == "plugin123"
        
    @patch("api.controllers.plugin_marketplace_controller.plugin_marketplace_service")
    def test_plugin_not_found(self, mock_service):
        mock_service.get_marketplace_plugin_by_id.side_effect = ValueError("Plugin not found")
        
        with pytest.raises(HTTPException) as exc_info:
            plugin_marketplace_controller.get_marketplace_plugin_by_id_controller("plugin123")
        assert exc_info.value.status_code == 404
        assert str(exc_info.value.detail) == "Plugin not found"
        
