import io
import pytest
from fastapi import UploadFile
from unittest.mock import patch, AsyncMock
from api.controllers.upload_controller import handle_upload

@pytest.mark.asyncio
async def test_valid_pt3_upload():
    fake_file = UploadFile(filename="experiment.pt3", file=io.BytesIO(b"fake pt3 content"))
    
    result = await handle_upload(fake_file)
    
    assert result["status"] == "pending"
    assert result["filename"] == "experiment.pt3"
    assert result["message"] == "File uploaded successfully"
    assert result["size_bytes"] > 0