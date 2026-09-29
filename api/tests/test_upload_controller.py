import io
import pytest
from fastapi import UploadFile
from unittest.mock import patch, AsyncMock
from api.controllers.upload_controller import handle_upload

@pytest.mark.asyncio
async def test_valid_ptu_upload():
    test_file = UploadFile(filename="experiment.ptu", file=io.BytesIO(b"bytes bytes bytes bytes"))
    
    result = await handle_upload(test_file)
    
    assert result["status"] == "pending"
    assert result["filename"] == "experiment.ptu"
    assert result["message"] == "File uploaded successfully"
    assert result["size_bytes"] > 0

@pytest.mark.asyncio
async def test_valid_csv_upload():
    test_file = UploadFile(filename="data.csv", file=io.BytesIO(b"time,intensity\n0.1,500"))
    
    result = await handle_upload(test_file)
    
    assert result["status"] == "pending"
    assert result["filename"] == "data.csv"

@pytest.mark.asyncio
async def test_valid_h5_upload():
    test_file = UploadFile(filename="data.h5", file=io.BytesIO(b"bytes bytes bytes bytes"))
    
    result = await handle_upload(test_file)
    
    assert result["status"] == "pending"
    assert result["filename"] == "data.h5"

@pytest.mark.asyncio
async def test_valid_hdf5_upload():
    test_file = UploadFile(filename="data.hdf5", file=io.BytesIO(b"bytes bytes bytes bytes"))
    
    result = await handle_upload(test_file)
    
    assert result["status"] == "pending"
    assert result["filename"] == "data.hdf5"
    
@pytest.mark.asyncio
async def test_invalid_extension_pdf():
    test_file = UploadFile(filename="report.pdf", file=io.BytesIO(b"pdf content"))
    
    with pytest.raises(Exception) as exc_info:
        await handle_upload(test_file)
    
    assert "400" in str(exc_info.value.status_code)
    assert "Unsupported file type" in exc_info.value.detail

@pytest.mark.asyncio
async def test_invalid_extension_exe():
    test_file = UploadFile(filename="invalid.exe", file=io.BytesIO(b"not SMS data"))
    
    with pytest.raises(Exception) as exc_info:
        await handle_upload(test_file)
    
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_uppercase_extension_still_works():
    test_file = UploadFile(filename="experiment.PTU", file=io.BytesIO(b"BYTES BYTES BYTES BYTESBYTES"))
    
    result = await handle_upload(test_file)
    
    assert result["status"] == "pending"

@pytest.mark.asyncio
async def test_response_has_all_expected_keys():
    test_file = UploadFile(filename="data.csv", file=io.BytesIO(b"col1,col2\n1,2"))
    
    result = await handle_upload(test_file)
    
    assert "message" in result
    assert "filename" in result
    assert "saved_as" in result
    assert "size_bytes" in result
    assert "status" in result