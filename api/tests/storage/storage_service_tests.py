import pytest
import os
import tempfile
from unittest.mock import patch, MagicMock, mock_open
from fastapi import HTTPException
from api.services.storage_service import (build_storage_key,create_signed_upload_url,object_exists ,download_to_temp
)

def test_build_storage_key():
    key = build_storage_key("123a-456b-789c", "up#67", "ch-8.hdf5")
    assert key == "123a-456b-789c/up#67/ch-8.hdf5"

@patch("api.services.storage_service.supabaseClient")
@patch("api.services.storage_service.BUCKET", "test-bucket")
def test_create_signed_upload_url(mock_supabase):
    mock_bucket = MagicMock()
    mock_supabase.storage.from_.return_value = mock_bucket
    mock_bucket.create_signed_upload_url.return_value = "https://supabse.bucket/upload"

    url = create_signed_upload_url("my_folder/ch-8.hdf5")
    assert url == "https://supabse.bucket/upload"
    mock_supabase.storage.from_.assert_called_with("test-bucket")
    mock_bucket.create_signed_upload_url.assert_called_once_with("my_folder/ch-8.hdf5")


@patch("api.services.storage_service.supabaseClient")
@patch("api.services.storage_service.BUCKET", "test-bucket")
def test_object_exists_true(mock_supabase):
    mock_bucket = MagicMock()
    mock_supabase.storage.from_.return_value = mock_bucket
    mock_bucket.list.return_value = [{"name": "file.h5"}]
    exists = object_exists("folder/file.h5")

    assert exists is True
    mock_bucket.list.assert_called_with(path="folder/file.h5")


@patch("api.services.storage_service.supabaseClient")
@patch("api.services.storage_service.BUCKET", "test-bucket")
def test_object_exists_false(mock_supabase):
    mock_bucket = MagicMock()
    mock_supabase.storage.from_.return_value = mock_bucket
    mock_bucket.list.return_value = None
    exists = object_exists("folder/missing.h5")
    assert exists is False


@patch("api.services.storage_service.supabaseClient")
@patch("api.services.storage_service.BUCKET", "test-bucket")
@patch("tempfile.mkstemp")
@patch("os.fdopen")
def test_download_to_temp_success(mock_fdopen, mock_mkstemp, mock_supabase):
    mock_mkstemp.return_value = (99, "/mock_safe_dir/ch-8.hdf5") 

    mock_file_handle = MagicMock()
    mock_fdopen.return_value.__enter__.return_value = mock_file_handle

    mock_bucket = MagicMock()
    mock_supabase.storage.from_.return_value = mock_bucket

    mock_bucket.download.return_value = b"fake binary data"
    filepath = download_to_temp("user/file.hdf5", ".hdf5")

    assert filepath == "/mock_safe_dir/ch-8.hdf5"
    mock_bucket.download.assert_called_once_with("user/file.hdf5")

    mock_file_handle.write.assert_called_once_with(b"fake binary data")


@patch("api.services.storage_service.supabaseClient")
@patch("api.services.storage_service.BUCKET", "test-bucket")
@patch("tempfile.mkstemp")
@patch("api.services.storage_service.os.path.exists")
@patch("api.services.storage_service.os.remove")
def test_download_to_temp_failure_cleanup(mock_remove, mock_exists, mock_mkstemp, mock_supabase):
    mock_mkstemp.return_value = (99, "/mock_safe_dir/failed_file.hdf5")
    mock_exists.return_value = True # Pretend the file got created

    # Force the supabase download to crash
    mock_bucket = MagicMock()
    mock_supabase.storage.from_.return_value = mock_bucket
    mock_bucket.download.side_effect = Exception("Network failure")

    with pytest.raises(HTTPException) as exc_info:
        download_to_temp("user/bad_file.hdf5")

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Error downloading file from storage."
    mock_remove.assert_called_once_with("/mock_safe_dir/failed_file.hdf5")