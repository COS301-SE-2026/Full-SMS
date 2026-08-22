import pytest
from unittest.mock import patch, MagicMock
from api.services import plugin_marketplace_service


@pytest.fixture
def mock_supabase():
    with patch("api.services.plugin_marketplace_service.get_supabase_admin") as mock:
        yield mock.return_value


class TestSubmitMarketplacePlugin:
    def test_succesful_submission(self, mock_supabase):
        plugin_id = "plugin123"
        user_id = "kuda123"

        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "id": plugin_id,
            "marketplace_status": None,
        }

        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": plugin_id, "marketplace_status": "pending_review"}
        ]

        result = plugin_marketplace_service.submit_marketplace_plugin(
            plugin_id, user_id
        )
        assert result["marketplace_status"] == "pending_review"

    def test_submit_plugin_not_found(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = (
            None
        )

        with pytest.raises(ValueError, match="Plugin not found"):
            plugin_marketplace_service.submit_marketplace_plugin("plugin123", "kuda123")

    def test_submit_plugin_already_pending(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "marketplace_status": "pending_review"
        }
        with pytest.raises(ValueError, match="Plugin is already pending review"):
            plugin_marketplace_service.submit_marketplace_plugin("plugin123", "kuda123")