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

    def test_stores_none_for_measurement_and_positions_on_page_level_comment(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        workspace.return_value = {"user_id": "Owner1", "member_ids": []}
        response = MagicMock()
        response.data = [{"id": "comment1"}]
        client.table.return_value.insert.return_value.execute.return_value = response

        from api.services.comment_service import add_comment
        add_comment(sample_workspace_id, sample_user_id, "upload1", "grouping", "This is a comment")

        row = client.table.return_value.insert.call_args[0][0]
        assert row["measurement_id"] is None
        assert row["anchor_x"] is None
        assert row["anchor_y"] is None

    def test_notifies_owner_and_members_but_not_author(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        workspace.return_value = {"user_id": "owner1", "member_ids": ["member1", sample_user_id]}
        response = MagicMock()
        response.data = [{"id": "comment1"}]
        client.table.return_value.insert.return_value.execute.return_value = response

        from api.services.comment_service import add_comment
        add_comment(sample_workspace_id, sample_user_id, "upload1", "intensity", "This is a comment")

        notified = [call.args[1] for call in notification.call_args_list]
        assert sorted(notified) == ["member1", "owner1"]
        assert sample_user_id not in notified
        notification.assert_any_call(sample_workspace_id, "owner1", "comment", "New comment on intensity")

    def test_owner_as_author_does_not_notify_self(self, mocks, sample_workspace_id):
        workspace, client, notification = mocks
        workspace.return_value = {"user_id": "owner1", "member_ids": ["member1"]}
        response = MagicMock()
        response.data = [{"id": "comment1"}]
        client.table.return_value.insert.return_value.execute.return_value = response

        from api.services.comment_service import add_comment
        add_comment(sample_workspace_id, "owner1", "upload1", "intensity", "This is a comment")

        notified = [call.args[1] for call in notification.call_args_list]
        assert notified == ["member1"]

    def test_raises_when_insert_returns_nothing(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        workspace.return_value = {"user_id": "owner1", "member_ids": ["member1"]}
        response = MagicMock()
        response.data = []
        client.table.return_value.insert.return_value.execute.return_value = response
        
        from api.services.comment_service import add_comment
        with pytest.raises(RuntimeError):
            add_comment(sample_workspace_id, sample_user_id, "upload1", "intensity", "This is a comment")

        notification.assert_not_called()

    def test_raises_and_skips_insert_when_no_access(self, mocks, sample_workspace_id, sample_user_id):
        workspace, client, notification = mocks
        workspace.side_effect = ValueError("Workspace not found")

        from api.services.comment_service import add_comment
        with pytest.raises(ValueError):
            add_comment(sample_workspace_id, sample_user_id, "upload1", "intensity", "This is a comment")

        client.table.assert_not_called()
        notification.assert_not_called()

