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


class TestGetProfile:
    def test_get_profile_success(self):
        with patch("routes.profile_routes.verify_token_controller", return_value=MOCK_VERIFIED_USER):
            with patch("controllers.profile_controller.get_user_profile", return_value=MOCK_PROFILE):
                response = client.get("/api/py/profile/me", headers={"Authorization": f"Bearer {MOCK_TOKEN}"})
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["user"]["username"] == "testuser"
    def test_get_profile_unauthorized(self):
        response = client.get("/api/py/profile/me")
        assert response.status_code == 401

    def test_get_profile_user_not_found(self):
        with patch("routes.profile_routes.verify_token_controller", return_value=MOCK_VERIFIED_USER):
            with patch("controllers.profile_controller.get_user_profile", side_effect=ValueError("User not found")):
                response = client.get("/api/py/profile/me", headers={"Authorization": f"Bearer {MOCK_TOKEN}"})
                assert response.status_code == 404

class TestUpdateProfile:
    def test_update_username_success(self):
        updated_profile = {**MOCK_PROFILE, "username": "newusername"}
        with patch("routes.profile_routes.verify_token_controller", return_value=MOCK_VERIFIED_USER):
            with patch("controllers.profile_controller.update_user_profile", return_value=updated_profile):
                response = client.put("/api/py/profile/me", headers={"Authorization": f"Bearer {MOCK_TOKEN}"}, json={"username": "newusername"})
                assert response.status_code == 200
                assert response.json()["user"]["username"] == "newusername"
    def test_update_profile_unauthorized(self):
        response = client.put("/api/py/profile/me", json={"username" : "newusername"})
        assert response.status_code == 401

    def test_update_profile_no_data(self):
        with patch("routes.profile_routes.verify_token_controller", return_value=MOCK_VERIFIED_USER):
            with patch("controllers.profile_controller.update_user_profile", side_effect=ValueError("No update data provided")):
                response = client.put("/api/py/profile/me", headers={"Authorization": f"Bearer {MOCK_TOKEN}"}, json={})
                assert response.status_code == 400

