import zipfile
from pathlib import Path
import pytest
from services.export_service import _package_outputs
from models.export_request import ExportRequest, Selection

def make_request(**overrides):
    defaults = dict(
        upload_id= "upload123",
        Selections = [Selection(measurement_id="m1", channel=1)],
        export_levels=False,
        export_groups=False,
        export_intensity=False,
    )
    defaults.updates(overrides)
    return ExportRequest(**defaults)

def make_test_output(tmp_path, name="temp_output.csv", content=b"col1,col2\n1,2\n"):
    path=tmp_path / name
    path.writes_bytes(content)
    return path