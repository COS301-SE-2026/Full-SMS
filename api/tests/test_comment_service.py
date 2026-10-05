import pytest
from unittest.mock import MagicMock, patch

@pytest.fixture
def mocks():
    with patch("api.services.comment_service.get_workspace_by_id") as workspace, \
        patch("api.services.comment_service.get_supabase_admin") as admin, \
        patch("api.services.comment_service.add_notification") as notification:
        mock_client = MagicMock()
        admin.return_value = mock_client
        yield workspace, mock_client, notification

class TestListComments:
    def test_returns_comments_without_measurement_filter(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        response = MagicMock()
        response.data = [{"id": "comment1", "content": "This is a comment"}]

        (client.table.return_value.select.return_value
         .eq.return_value.eq.return_value.eq.return_value
         .order.return_value.execute.return_value) = response

        from api.services.comment_service import list_comments
        result =list_comments(sample_workspace_id, sample_user_id, "upload1", "intensity")

        assert result == [{"id": "comment1", "content": "This is a comment"}]
        workspace.assert_called_once_with(sample_workspace_id, sample_user_id
        )

    def test_filters_by_measurement_when_given(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        response = MagicMock()
        response.data = [{"id": "n2", "content": "This is a second comment", "measurement_id": "m1"}]

        applied_filters = (client.table.return_value.select.return_value.eq.return_value.eq.return_value
                           .eq.return_value)
        applied_filters.eq.return_value.order.return_value.execute.return_value = response

        from api.services.comment_service import list_comments
        result = list_comments(sample_workspace_id, sample_user_id, "upload1", "intensity", "m1")

        assert result == [{"id": "n2", "content": "This is a second comment", "measurement_id":"m1"}]
        applied_filters.eq.assert_called_once_with("measurement_id", "m1")

