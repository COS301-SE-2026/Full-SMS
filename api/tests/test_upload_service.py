import io
import pytest
from pathlib import Path
from fastapi import UploadFile
from services.upload_service import save_temp_file, get_file_size

@pytest.mark.asyncio
async def test_file_is_saved_to_disk():
    # Simulate a fake uploaded file
    fake_content = b"fake pt3 binary content"
    fake_file = UploadFile(filename="test.pt3", file=io.BytesIO(fake_content))

    saved_path = await save_temp_file(fake_file)

    assert saved_path.exists()
    # Check the filename contains the original name
    assert "test.pt3" in saved_path.name

@pytest.mark.asyncio
async def test_file_size_is_correct():
    fake_content = b"fake pt3 binary content"
    fake_file = UploadFile(filename="test.pt3", file=io.BytesIO(fake_content))

    saved_path = await save_temp_file(fake_file)
    size = get_file_size(saved_path)

    assert size == len(fake_content)