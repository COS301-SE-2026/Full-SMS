import zipfile
from pathlib import Path
import pytest
from services.export_service import _package_outputs
from models.export_request import ExportRequest, Selection

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

    