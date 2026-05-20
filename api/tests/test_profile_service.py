import pytest
from unittest.mock import patch, MagicMock
from api.services.profile_service import get_user_profile 

MOCK_USER_ID = "test-user-123"

def make_mock_user(username="testuser", role="researcher"):
    user = MagicMock()
    user.id = MOCK_USER_ID
    user.email = "test@example.com"
    user.user_metadata = {"username": username, "role": role}
    return user

def test_get_user_profile_returns_correct_fields():
    mock_user = make_mock_user()
    mock_response = MagicMock()
    mock_response.user = mock_user

    with patch("api.services.profile_service.get_supabase_admin") as mock_admin:
        mock_admin.return_value.auth.admin.get_user_by_id.return_value = mock_response
        result = get_user_profile(MOCK_USER_ID)

    assert result["id"] == MOCK_USER_ID
    assert result["email"] == "test@example.com"
    assert result["username"] == "testuser"
    assert result["role"] == "researcher"


