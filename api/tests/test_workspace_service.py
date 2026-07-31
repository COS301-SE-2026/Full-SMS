import pytest
from unittest.mock import MagicMock, patch


class TestGetUserWorkspaces:
    def test_returns_list_of_workspaces(self, sample_user_id):
        with patch("api.services.workspace_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{"id": "ws1", "name": "Workspace 1"}]
            mock_client.rpc.return_value.execute.return_value = mock_response
            mock_admin.return_value = mock_client

            from api.services.workspace_service import get_user_workspaces

            result = get_user_workspaces(sample_user_id)

            assert len(result) == 1
            assert result[0]["name"] == "Workspace 1"


class TestGetWorkspaceById:
    def test_returns_workspace_when_found(self, sample_workspace_id, sample_user_id):
        with patch("api.services.workspace_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = {
                "id": sample_workspace_id,
                "user_id": sample_user_id,
                "name": "Test",
                "description": None,
                "storage_bucket_path": "/path",
                "status": "active",
                "created_at": "2024-01-01",
                "updated_at": "2024-01-01",
                "workspace_files": [{"count": 5}],
            }
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.workspace_service import get_workspace_by_id

            result = get_workspace_by_id(sample_workspace_id, sample_user_id)

            assert result["id"] == sample_workspace_id
            assert result["file_count"] == 5

    def test_raises_when_not_found(self, sample_workspace_id, sample_user_id):
        with patch("api.services.workspace_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = None
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.workspace_service import get_workspace_by_id

            with pytest.raises(ValueError, match="Workspace not found"):
                get_workspace_by_id(sample_workspace_id, sample_user_id)


class TestCreateWorkspace:
    def test_creates_workspace(self, sample_user_id):
        with patch("api.services.workspace_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {"id": "new-id", "name": "New Workspace", "status": "active"}
            ]
            mock_client.table.return_value.insert.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.workspace_service import create_workspace

            result = create_workspace(sample_user_id, "New Workspace", "Description")

            assert result["name"] == "New Workspace"
            assert result["file_count"] == 0

    def test_rejects_short_name(self, sample_user_id):
        from api.services.workspace_service import create_workspace

        with pytest.raises(ValueError, match="at least 3 characters"):
            create_workspace(sample_user_id, "ab", None)


class TestUpdateWorkspace:
    def test_rejects_invalid_status(self, sample_workspace_id, sample_user_id):
        from api.services.workspace_service import update_workspace

        with pytest.raises(ValueError, match="Invalid workspace status"):
            update_workspace(
                sample_workspace_id, sample_user_id, workspace_status="invalid"
            )


class TestDeleteWorkspace:
    def test_raises_when_not_found(self, sample_workspace_id, sample_user_id):
        with patch("api.services.workspace_service.get_workspace_by_id") as mock_get:
            mock_get.side_effect = ValueError("Workspace not found")

            from api.services.workspace_service import delete_workspace

            with pytest.raises(ValueError, match="Workspace not found"):
                delete_workspace(sample_workspace_id, sample_user_id)


class TestArchiveWorkspace:
    def test_archives_workspace(self, sample_workspace_id, sample_user_id):
        with patch("api.services.workspace_service.update_workspace") as mock_update:
            mock_update.return_value = {"id": sample_workspace_id, "status": "archived"}

            from api.services.workspace_service import archive_workspace

            result = archive_workspace(sample_workspace_id, sample_user_id)

            mock_update.assert_called_with(
                sample_workspace_id, sample_user_id, workspace_status="archived"
            )
            assert result["status"] == "archived"


class TestUnarchiveWorkspace:
    def test_unarchives_workspace(self, sample_workspace_id, sample_user_id):
        with patch("api.services.workspace_service.update_workspace") as mock_update:
            mock_update.return_value = {"id": sample_workspace_id, "status": "active"}

            from api.services.workspace_service import unarchive_workspace

            result = unarchive_workspace(sample_workspace_id, sample_user_id)

            mock_update.assert_called_with(
                sample_workspace_id, sample_user_id, workspace_status="active"
            )
            assert result["status"] == "active"
