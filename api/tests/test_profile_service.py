import pytest
from unittest.mock import patch, MagicMock
from api.services.profile_service import get_user_profile 

MOCK_USER_ID = "test-user-123"

def make_mock_user(username="testuser", role="researcher");
    user = MagicMock()
    user.id = MOCK_USER_ID
    user.email = "test@example.com"
    user.user_metadata = {"username": username, "role": role}
    return user

