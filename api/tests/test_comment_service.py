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

    def test_scopes_query_to_workspace_upload_and_tab(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        response = MagicMock()
        response.data = []

        (client.table.return_value.select.return_value
         .eq.return_value.eq.return_value.eq.return_value
         .order.return_value.execute.return_value) = response

        from api.services.comment_service import list_comments
        list_comments(sample_workspace_id, sample_user_id, "upload1", "lifetime")

        client.table.assert_called_once_with("comments")
        first= client.table.return_value.select.return_value
        first.eq.assert_called_once_with("workspace_id", sample_workspace_id)
        second = first.eq.return_value
        second.eq.assert_called_once_with("upload_id", "upload1")
        third = second.eq.return_value
        third.eq.assert_called_once_with("tab", "lifetime")

    def test_returns_empty_list_when_no_data(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        response = MagicMock()
        response.data = None

        (client.table.return_value.select.return_value
         .eq.return_value.eq.return_value.eq.return_value
         .order.return_value.execute.return_value) = response

        from api.services.comment_service import list_comments
        result = list_comments(sample_workspace_id, sample_user_id, "upload1", "intensity")

        assert result == []

    def test_raises_and_skips_query_when_no_access(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        workspace.side_effect = ValueError("Workspace not found")

        from api.services.comment_service import list_comments
        with pytest.raises(ValueError):
            list_comments(sample_workspace_id, sample_user_id, "upload1", "intensity")

        client.table.assert_not_called()

class TestAddComment:
    def test_inserts_row_with_writer_measurement_and_positions(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        workspace.return_value = {"user_id": "Owner1", "member_ids": ["Member1", sample_user_id]}
        response = MagicMock()
        response.data = [{"id": "comment1"}]
        client.table.return_value.insert.return_value.execute.return_value = response

        from api.services.comment_service import add_comment
        result = add_comment(sample_workspace_id, sample_user_id, "upload1", "intensity", "This is a comment",
                             measurement_id="m1", anchor_x=1.5, anchor_y=2.5)

        row = client.table.return_value.insert.call_args[0][0]

        assert row["workspace_id"] == sample_workspace_id
        assert row["upload_id"] == "upload1"
        assert row["measurement_id"] == "m1"
        assert row["tab"] == "intensity"
        assert row["anchor_x"] == 1.5
        assert row["anchor_y"] == 2.5
        assert row["author_id"] == sample_user_id
        assert result == {"id": "comment1"}

