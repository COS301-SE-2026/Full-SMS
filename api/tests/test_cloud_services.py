"""
Tests for OneDrive-related cloud service functions.
Covers token retrieval and the background upload processing flow.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from api.services.cloud_service import get_onedrive_token, onedrive_upload_service



@patch("api.services.cloud_service.supabaseClient")
@patch("api.services.cloud_service.httpx.post")
def test_get_onedrive_token_good_path(mock_httpx_post, mock_supabase_client):
    """Token retrieval should return a fresh access token and expiry."""
    # Simulate a user who already has a refresh token stored in Supabase
    mock_supabase_client.table().select().eq().eq().execute.return_value.data = [
        {"refresh_token": "valid-refresh-token"}
    ]

    # Mock Microsoft's token endpoint response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "new-access-token",
        "expires_in": 3600,
    }
    mock_httpx_post.return_value = mock_response

    tokens = get_onedrive_token("user-123")

    assert tokens["access_token"] == "new-access-token", "Access token didn't match"
    assert tokens["expires_in"] == 3600, "Expiry time mismatch"


@patch("api.services.cloud_service.supabaseClient")
def test_get_onedrive_token_raises_404_when_not_linked(mock_supabase_client):
    """If no refresh token exists for the user, a 404 HTTPException should be raised."""
    mock_supabase_client.table().select().eq().eq().execute.return_value.data = []

    with pytest.raises(HTTPException) as exc_info:
        get_onedrive_token("user-123")

    assert exc_info.value.status_code == 404, "Should have returned 404 status code"



@patch("api.services.cloud_service.get_onedrive_token")
@patch("api.services.cloud_service.httpx.Client")
@patch("api.services.cloud_service.supabaseClient")
@patch("api.services.cloud_service.set_status")
@patch("api.services.cloud_service.hdf5_job_service.enqueue_parse")
def test_onedrive_upload_service_complete_flow(
    mock_enqueue_parse,
    mock_set_status,
    mock_supabase_client,
    mock_httpx_client,
    mock_get_token,
):
    """Upload service should download file from Graph, upload to Supabase, and enqueue parsing."""
    # mocked a valid token for downloading the file
    mock_get_token.return_value = {"access_token": "test-token"}

    # HTTP client context manager and Graph API download response
    mock_http_instance = MagicMock()
    mock_graph_response = MagicMock()
    mock_graph_response.status_code = 200
    mock_graph_response.content = b"fake-hdf5-file-bytes"
    mock_http_instance.__enter__.return_value.get.return_value = mock_graph_response
    mock_httpx_client.return_value = mock_http_instance

    onedrive_upload_service(
        user_id="user-123",
        upload_id="upload-456",
        storage_key="user-123/upload-456/sample.h5",
        file_id="graph-file-id-789",
        file_name="sample.h5",
        workspace_id="ws-001",
    )

    # cheking the file content was uploaded to Supabase Storage exactly once
    mock_supabase_client.storage.from_().upload.assert_called_once()

    # The service should update the status at least twice (start and finish/error)
    assert mock_set_status.call_count >= 2, "Expected multiple status updates"

    # A Celery parse job should be queued with the correct arguments
    mock_enqueue_parse.assert_called_once_with(
        "upload-456",
        "user-123",
        "user-123/upload-456/sample.h5",
    )