import io
import pytest
from fastapi import UploadFile, HTTPException
from unittest.mock import patch
from controllers.hdf5_controller import (read_hdf5_file, init_hdf5_upload, complete_hdf5_upload, get_hdf5_upload_status, get_hdf5_upload_result)

class TestInitHdf5Upload:
    def test_owner_can_initiate_upload(self):
        content = {
            "filename": "sample.h5",
            "size_bytes": 1024,
            "workspace_id": "ws-1",
            "sha256": "abc123"
        }

        sample_user = {"user": {"id": "user-1"}}

        with patch("controllers.hdf5_controller.workspace_service.get_workspace_by_id") as mock_get_workspace, \
             patch("controllers.hdf5_controller.hdf5_upload_service.validate_upload_request") as mock_validate, \
             patch("controllers.hdf5_controller.hdf5_upload_service.create_upload_record") as mock_create_upload_record, \
             patch("controllers.hdf5_controller.storage_service.create_signed_upload_url") as mock_signed_upload_url:

            mock_get_workspace.return_value = {"id": "ws-1", "user_id": "user-1"}
            mock_create_upload_record.return_value = {
                "id": "upload-1",
                "storage_key": "key-1",
                "size_bytes": 1024,
                "filename": "sample.h5",
            }
            mock_signed_upload_url.return_value = "https://signed-url.exampledomain.com"

            result = init_hdf5_upload(content, sample_user)

            assert result["upload_id"] == "upload-1"
            assert result["upload_url"] == "https://signed-url.exampledomain.com"
            mock_validate.assert_called_with("sample.h5", 1024)

    def test_rejects_not_owner_user(self):
        content = {
            "filename": "sample.h5",
            "size_bytes": 1024,
            "workspace_id": "ws-1",
            "sha256": "abc123"
        }

        sample_user = {"user": {"id": "user1"}}

        with patch("controllers.hdf5_controller.workspace_service.get_workspace_by_id") as mock_get_workspace:
            mock_get_workspace.return_value = {"id": "ws-1", "user_id": "owner0"}

            with pytest.raises(HTTPException) as exception:
                init_hdf5_upload(content, sample_user)

            assert exception.value.status_code == 403

