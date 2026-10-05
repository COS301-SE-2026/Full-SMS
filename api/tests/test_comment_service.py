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

