import io
import pytest
from fastapi import UploadFile
from api.controllers.upload_controller import handle_upload


class TestMissingFileTypes:
    """Tests for file types not covered in existing test suite."""

    @pytest.mark.asyncio
    async def test_ptu_file_accepted(self):
        """
        .ptu files should be accepted.
        """
        fake_file = UploadFile(
            filename="measurement.ptu",
            file=io.BytesIO(b"fake ptu binary content")
        )
        result = await handle_upload(fake_file)
        assert result["status"] == "pending"
        assert result["filename"] == "measurement.ptu"

    @pytest.mark.asyncio
    async def test_uppercase_h5_extension(self):
        """.H5 uppercase should be treated same as .h5"""
        fake_file = UploadFile(
            filename="data.H5",
            file=io.BytesIO(b"fake h5 content")
        )
        result = await handle_upload(fake_file)
        assert result["status"] == "pending"

    @pytest.mark.asyncio
    async def test_uppercase_hdf5_extension(self):
        """.HDF5 uppercase should be treated same as .hdf5"""
        fake_file = UploadFile(
            filename="data.HDF5",
            file=io.BytesIO(b"fake hdf5 content")
        )
        result = await handle_upload(fake_file)
        assert result["status"] == "pending"    

    @pytest.mark.asyncio
    async def test_uppercase_h5_extension(self):
        """.H5 uppercase should be treated same as .h5"""
        fake_file = UploadFile(
            filename="data.H5",
            file=io.BytesIO(b"fake h5 content")
        )
        result = await handle_upload(fake_file)
        assert result["status"] == "pending"

    @pytest.mark.asyncio
    async def test_uppercase_hdf5_extension(self):
        """.HDF5 uppercase should be treated same as .hdf5"""
        fake_file = UploadFile(
            filename="data.HDF5",
            file=io.BytesIO(b"fake hdf5 content")
        )
        result = await handle_upload(fake_file)
        assert result["status"] == "pending"  

class TestEdgeCases:
    """Edge case tests for upload controller."""

    @pytest.mark.asyncio
    async def test_file_with_no_extension_rejected(self):
        """Files with no extension should be rejected."""
        fake_file = UploadFile(
            filename="no_extension",
            file=io.BytesIO(b"some content")
        )
        with pytest.raises(Exception) as exc_info:
            await handle_upload(fake_file)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_txt_file_rejected(self):
        """.txt files should be rejected."""
        fake_file = UploadFile(
            filename="notes.txt",
            file=io.BytesIO(b"some text")
        )
        with pytest.raises(Exception) as exc_info:
            await handle_upload(fake_file)
        assert exc_info.value.status_code == 400
        assert "Unsupported file type" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_jpg_file_rejected(self):
        """.jpg files should be rejected."""
        fake_file = UploadFile(
            filename="photo.jpg",
            file=io.BytesIO(b"fake image bytes")
        )
        with pytest.raises(Exception) as exc_info:
            await handle_upload(fake_file)
        assert exc_info.value.status_code == 400