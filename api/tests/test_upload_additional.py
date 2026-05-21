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