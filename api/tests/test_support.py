import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

MOCK_TOKEN = "mock.jwt.token"
MOCK_USER_ID = "test-user-123"

MOCK_VERIFIED_USER = {
    "valid": True,
    "user": {"id": MOCK_USER_ID, "email": "test@example.com", "role": "authenticated"}
}

MOCK_PROFILE = {
    "id":  MOCK_USER_ID,
    "email": "test@example.com",
    "username": "testuser", 
    "role": "researcher"
}

class TestSubmitTicket:
    def test_submit_ticket_success(self):
        with patch("api.controllers.support_controller.send_email", return_value={"id": "mocked-email"}) as mock_send:
            response = client.post("/api/py/support/",  params={"user_email": MOCK_PROFILE["email"], "message":"This is a message."})
            assert response.status_code == 200
            mock_send.assert_called_once_with(MOCK_PROFILE["email"], "This is a message.")
            assert response.json() == {"id": "mocked-email"}

    def test_submit_ticket_failure(self):
        with patch("api.controllers.support_controller.send_email", side_effect=ValueError("Failed to send a ticket")):
            response = client.post("/api/py/support/",  params={"user_email": MOCK_PROFILE["email"], "message":"This is a message."})
            assert response.status_code == 500