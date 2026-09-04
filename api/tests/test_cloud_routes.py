import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from api.main import app
from api.routes.profile_routes import get_current_user

fake_user_id = "test-user-123"

def mock_current_user():
    return {"user": {"id": fake_user_id, "email": "test@example.com"}}

app.dependency_overrides[get_current_user] = mock_current_user

client = TestClient(app)


def test_onedrive_token_success():
    # Patch the controller function so we don't hit the actual token service
    with patch("api.controllers.cloud_controller.get_onedrive_token") as token_mock:
        token_mock.return_value = {
            "access_token": "mock-access-token-123",
            "expires_in": 3600,
        }
        response = client.get("/api/py/cloud/onedrive/token")

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "mock-access-token-123"
        token_mock.assert_called_once_with(fake_user_id)


def test_onedrive_token_unlinked_returns_404():
    with patch("api.controllers.cloud_controller.get_onedrive_token") as token_mock:
        token_mock.side_effect = Exception("OneDrive account not linked")
        response = client.get("/api/py/cloud/onedrive/token")

        assert response.status_code == 404


def test_upload_from_onedrive_starts_background_job():
    payload = {
        "file_id": "item-999",
        "filename": "dataset.h5",
        "workspace_id": "workspace-abc",
    }

    # Make sure we don't actually upload or create a real record
    with patch("api.controllers.cloud_controller.create_upload_record") as record_mock, \
         patch("api.controllers.cloud_controller.onedrive_upload_service") as service_mock:
        
        record_mock.return_value = {
            "id": "upload-uuid-555",
            "storage_key": f"{fake_user_id}/upload-uuid-555/dataset.h5",
        }

        response = client.post("/api/py/cloud/upload/onedrive", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "started"
        assert data["upload_id"] == "upload-uuid-555"
        assert data["filename"] == "dataset.h5"

        record_mock.assert_called_once_with(
            user_id=fake_user_id,
            filename="dataset.h5",
            workspace_id="workspace-abc",
            size_bytes=1,
            sha256="",
        )


def test_upload_from_onedrive_missing_fields():
    # missing filename & workspace_id
    response = client.post("/api/py/cloud/upload/onedrive", json={"file_id": "123"})
    assert response.status_code == 422