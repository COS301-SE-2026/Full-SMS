import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def mocks():
    with patch("api.services.parameter_history_service.get_workspace_by_id") as owner, \
        patch("api.services.parameter_history_service.get_supabase_admin") as admin:
        mock_client = MagicMock()
        admin.return_value = mock_client
        yield owner, mock_client
    
class TestListHistory:
    def test_returns_entries(self, mocks, sample_workspace_id, sample_user_id):
        owner, client = mocks
        response = MagicMock()
        response.data = [{"id": "h1", "parameter": "bin"}]
        (client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value
         .limit.return_value.execute.return_value) = response

        from api.services.parameter_history_service import list_history
        result = list_history(sample_workspace_id, sample_user_id, "u1", "intensity")

        assert result == [{"id": "h1", "parameter": "bin"}]
        owner.assert_called_once_with(sample_workspace_id, sample_user_id)
 