import zipfile
from pathlib import Path
import pytest
from services.export_service import _package_outputs
from models.export_request import ExportRequest, Selection

import services.export_service as export_service
from services.export_service import (
      _export_intensity_data,
      _export_levels_data,
      _export_groups_data,
      _
)

def make_request(**overrides):
    defaults = dict(
        upload_id= "upload123",
        selections = [Selection(measurement_id="m1", channel=1)],
        export_levels=False,
        export_groups=False,
        export_intensity=False,
    )
    defaults.update(overrides)
    return ExportRequest(**defaults)

def make_test_output(tmp_path, name="temp_output.csv", content=b"col1,col2\n1,2\n"):
    path=tmp_path / name
    path.write_bytes(content)
    return path


class TestExportIntensityData:

    def test_uncheckedBox_intensity_data(self):
        intensity_request = make_request(export_intensity=False) 
        assert _export_intensity_data(intensity_request, {}, 1, "m1") is None


class TestExportLevelsData:

    def test_uncheckedBox_levels_data(self):
        levels_request = make_request(export_levels=False)
        analysis = {"levels": {"levels": [{"id": 1}]}} 
        assert _export_levels_data(levels_request, analysis, "m1") is None


class TestExportGroupsData:
    def test_uncheckedBox_groups_data(self):
        groups_request = make_request(export_groups=False)
        analysis = {"groups": {"selected_step_index": 0, "steps": [{"groups": []}]}} 
        assert _export_groups_data(groups_request, analysis, "m1") is None


   
    
    
class TestPackageOutputs:
    def test_single_output_unzipped(self, tmp_path):
        path= make_test_output(tmp_path)
        request = make_request()
        output_paths = [(path, "temp_output.csv")]

        result_path, result_name = _package_outputs(output_paths, request)

        assert result_path == path
        assert result_name == "temp_output.csv"

    def test_multiple_outputs_zipped(self, tmp_path) :
        path1= make_test_output(tmp_path, name="first.csv")
        path2= make_test_output(tmp_path, name="second.csv")

        request = make_request(export_intensity=True, export_levels=True,)

        output_paths = [ (path1, "first.csv"), (path2, "second.csv"),]

        result_path, result_name = _package_outputs(output_paths, request)

        assert result_path.suffix == ".zip"
        assert result_name.endswith(".zip")

        with zipfile.ZipFile(result_path) as zpf:
            names = zpf.namelist()
            assert "first.csv" in names
            assert "second.csv" in names


    def test_zip_filename_contents(self, tmp_path) :
            path1= make_test_output(tmp_path, name="first.csv")
            path2= make_test_output(tmp_path, name="second.csv")
    
            request = make_request(
                 upload_id="upload123",
                 export_intensity=True, 
                 selections=[
                      Selection(measurement_id="m4", channel=1,)
                 ],
                )
    
            output_paths = [ (path1, "first.csv"), (path2, "second.csv"),]
    
            _, result_name= _package_outputs(output_paths, request)

            assert "upload123" in result_name
            assert "m4" in result_name
            assert "intensity" in result_name
            assert result_name.endswith(".zip")
    
    def test_unselected_exportCategories_exclusion(self, tmp_path) :
                path1= make_test_output(tmp_path, name="first.csv")
                path2= make_test_output(tmp_path, name="second.csv")
        
                request = make_request(export_groups=True)
        
                output_paths = [ (path1, "first.csv"), (path2, "second.csv"),]
        
                _, result_name= _package_outputs(output_paths, request)
    
                assert "groups" in result_name
                assert "intensity" not in result_name
                assert "levels" not in result_name

    