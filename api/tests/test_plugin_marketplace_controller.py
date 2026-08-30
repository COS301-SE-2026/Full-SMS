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