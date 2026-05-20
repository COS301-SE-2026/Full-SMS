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

@pytest.mark.asyncio
async def test_valid_csv_upload():
    fake_file = UploadFile(filename="data.csv", file=io.BytesIO(b"time,intensity\n0.1,500"))
    
    result = await handle_upload(fake_file)
    
    assert result["status"] == "pending"
    assert result["filename"] == "data.csv"

@pytest.mark.asyncio
async def test_invalid_extension_pdf():
    fake_file = UploadFile(filename="report.pdf", file=io.BytesIO(b"pdf content"))
    
    with pytest.raises(Exception) as exc_info:
        await handle_upload(fake_file)
    
    assert "400" in str(exc_info.value.status_code)
    assert "Unsupported file type" in exc_info.value.detail

@pytest.mark.asyncio
async def test_invalid_extension_exe():
    fake_file = UploadFile(filename="malware.exe", file=io.BytesIO(b"bad content"))
    
    with pytest.raises(Exception) as exc_info:
        await handle_upload(fake_file)
    
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_uppercase_extension_still_works():
    # .PT3 should work the same as .pt3 because we call .lower()
    fake_file = UploadFile(filename="experiment.PT3", file=io.BytesIO(b"fake content"))
    
    result = await handle_upload(fake_file)
    
    assert result["status"] == "pending"

@pytest.mark.asyncio
async def test_response_has_all_expected_keys():
    fake_file = UploadFile(filename="data.csv", file=io.BytesIO(b"col1,col2\n1,2"))
    
    result = await handle_upload(fake_file)
    
    assert "message" in result
    assert "filename" in result
    assert "saved_as" in result
    assert "size_bytes" in result
    assert "status" in result