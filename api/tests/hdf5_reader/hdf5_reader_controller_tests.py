import io
import pytest
from fastapi import UploadFile, HTTPException
from unittest.mock import patch
from controllers.hdf5_controller import read_hdf5_file

@pytest.mark.asyncio
async def test_read_hdf5_rejects_non_hdf5():
    fake_file = UploadFile(filename="data.txt", file=io.BytesIO(b"hi"))
    with pytest.raises(HTTPException) as exc:
        await read_hdf5_file(fake_file)
    assert exc.value.status_code == 400
    assert "Invalid file type" in exc.value.detail

@pytest.mark.asyncio
async def test_read_hdf5_calls_service_and_cleans_temp():
    fake_file = UploadFile(filename="data.h5", file=io.BytesIO(b"fake h5 content"))
    captured = {}

    def fake_read_hdf5(path):
        captured["path"] = path
        return {"ok": True}

    with patch("controllers.hdf5_controller.read_hdf5_service.read_hdf5", side_effect=fake_read_hdf5):
        result = await read_hdf5_file(fake_file)

    assert result == {"ok": True}
    assert "path" in captured
    assert not captured["path"].exists()

@pytest.mark.asyncio
async def test_read_hdf5_cleanup_on_error():
    fake_file = UploadFile(filename="data.hdf5", file=io.BytesIO(b"fake hdf5 content"))
    captured = {}

    def fake_read_hdf5(path):
        captured["path"] = path
        raise ValueError("boom")

    with patch("controllers.hdf5_controller.read_hdf5_service.read_hdf5", side_effect=fake_read_hdf5):
        with pytest.raises(ValueError):
            await read_hdf5_file(fake_file)

    assert not captured["path"].exists()