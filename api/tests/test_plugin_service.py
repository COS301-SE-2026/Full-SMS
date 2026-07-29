import pytest
from unittest.mock import MagicMock, patch
import uuid


class TestCreatePlugin:

    def test_create_plugin_success(self, sample_user_id, sample_plugin_config):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Test Plugin",
                    "enabled": True,
                }
            ]
            mock_client.table.return_value.insert.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import create_plugin

            result = create_plugin(
                user_id=sample_user_id,
                name="Test Plugin",
                config=sample_plugin_config,
                script="result = 42",
            )

            assert result["name"] == "Test Plugin"
            assert result["enabled"] is True

    def test_create_plugin_missing_name(self, sample_user_id, sample_plugin_config):
        from api.services.plugin_service import create_plugin

        with pytest.raises(ValueError):
            create_plugin(
                user_id=sample_user_id,
                name="",
                config=sample_plugin_config,
                script="result = 42",
            )

    def test_create_plugin_missing_outputs(self, sample_user_id):
        from api.services.plugin_service import create_plugin

        with pytest.raises(ValueError, match="at least one output"):
            create_plugin(
                user_id=sample_user_id,
                name="Test",
                config={"parameters": [], "outputs": []},
                script="result = 42",
            )


class TestDeletePlugin:
    def test_delete_plugin_not_found(self, sample_plugin_id, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = None
            mock_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import delete_plugin

            with pytest.raises(ValueError, match="Plugin not found"):
                delete_plugin(sample_plugin_id, sample_user_id)


class TestUpdatePlugin:
    def test_updates_plugin_name(self, sample_plugin_id, sample_user_id):
        with patch(
            "api.services.plugin_service.get_supabase_admin"
        ) as mock_admin, patch(
            "api.services.plugin_service.get_plugin_by_id"
        ) as mock_get:
            mock_get.return_value = {"id": sample_plugin_id, "name": "Updated"}

            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{"id": sample_plugin_id}]
            mock_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import update_plugin

            result = update_plugin(sample_plugin_id, sample_user_id, name="Updated")

            assert result["name"] == "Updated"


class TestGetUserPlugins:
    def test_returns_list_of_plugins(self, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{"id": "p1", "name": "Plugin 1"}]
            mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import get_user_plugins

            result = get_user_plugins(sample_user_id)

            assert len(result) == 1
            assert result[0]["name"] == "Plugin 1"


class TestGetPluginById:
    def test_returns_plugin_when_found(self, sample_plugin_id, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = {"id": sample_plugin_id, "name": "Test Plugin"}
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import get_plugin_by_id

            result = get_plugin_by_id(sample_plugin_id, sample_user_id)

            assert result["id"] == sample_plugin_id
