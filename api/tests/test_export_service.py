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

class TestPackageOutputs:
    def single_output_unzipped(self, tmp_path):
        path= make_test_output(tmp_path)
        request = make_request()
        output_paths = [(path, "temp_output.csv")]

        result_path, result_name = _package_outputs(output_paths, request)

        assert result_path == path
        assert result_path == "temp_output.csv"