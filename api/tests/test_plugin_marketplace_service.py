import pytest
from unittest.mock import Mock, patch
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


class TestCancelPluginSubmission:
    def test_successful_submission_cancellation(self, mock_supabase):
        plugin_id = "plugin123"
        user_id = "kuda123"

        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "marketplace_status": "pending_review"
        }

        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": plugin_id, "marketplace_status": None}
        ]

        result = plugin_marketplace_service.cancel_plugin_submission(plugin_id, user_id)
        assert result["marketplace_status"] is None

    def test_cancel_submission_not_pending(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "marketplace_status": "approved"
        }

        with pytest.raises(
            ValueError,
            match="Plugin is only allowed to cancel submission if it is pending review",
        ):
            plugin_marketplace_service.cancel_plugin_submission("plugin123", "kuda123")


class TestGetMarketplacePlugins:
    def test_get_marketplace_plugins(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {"id": "plugin1", "name": "heatmap plugin"},
            {"id": "plugin2", "name": "histogram plugin"},
        ]

        result = plugin_marketplace_service.get_marketplace_plugins()

        assert len(result) == 2
        assert result[0]["name"] == "heatmap plugin"


class TestGetMarketplacePluginById:
    def test_get_marketplace_plugin_by_id(self, mock_supabase):
        plugin_data = {"id": "plugin123", "name": "Test Plugin"}
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value.data = (
            plugin_data
        )

        result = plugin_marketplace_service.get_marketplace_plugin_by_id("plugin123")

        assert result["id"] == "plugin123"
        assert result["name"] == "Test Plugin"


class TestGetPluginsInReview:
    def test_successful_get_plugins_in_review(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {"id": "plugin1", "marketplace_status": "pending_review"},
        ]

        result = plugin_marketplace_service.get_plugins_in_review()

        assert len(result) == 1
        assert result[0]["marketplace_status"] == "pending_review"


class TestGetAllMarketplacePlugins:
    def test_successful_get_all_marketplace_plugins(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.is_.return_value.order.return_value.execute.return_value.data = [
            {"id": "plugin1", "marketplace_status": "approved"},
            {"id": "plugin2", "marketplace_status": "pending_review"},
        ]

        result = plugin_marketplace_service.get_all_marketplace_plugins()

        assert len(result) == 2


class TestApprovePlugin:
    def test_successful_approve_plugin(self, mock_supabase):
        plugin_id = "plugin123"
        admin_id = "admin123"

        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "marketplace_status": "pending_review",
        }

        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
            {"id": plugin_id, "marketplace_status": "approved"}
        ]

        result = plugin_marketplace_service.approve_plugin_submission(
            plugin_id, admin_id
        )

        assert result["marketplace_status"] == "approved"

    def test_approve_plugin_submission_not_in_review(self, mock_supabase):
        plugin_id = "plugin123"
        admin_id = "admin123"

        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "marketplace_status": "approved",
        }

        with pytest.raises(ValueError, match="Plugin is not pending review"):
            plugin_marketplace_service.approve_plugin_submission(plugin_id, admin_id)


class TestRejectPlugin:
    def test_successful_reject_plugin(self, mock_supabase):
        plugin_id = "plugin123"
        admin_id = "admin123"
        feedback = "you don't have no future here you dont have future you can never make it hahaha"

        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "marketplace_status": "pending_review",
        }

        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
            {"id": plugin_id, "marketplace_status": "rejected"}
        ]

        result = plugin_marketplace_service.reject_plugin_submission(
            plugin_id, admin_id, feedback
        )

        assert result["marketplace_status"] == "rejected"


class TestGetReviewerInfo:
    def test_successful_get_reviewer_info(self, mock_supabase):
        mock_user = Mock()
        mock_user.email = "kuda@testing.com"
        mock_response = Mock()
        mock_response.user = mock_user
        mock_supabase.auth.admin.get_user_by_id.return_value = mock_response

        result = plugin_marketplace_service.get_reviewer_info("admin123")
        assert result["email"] == "kuda@testing.com"
