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