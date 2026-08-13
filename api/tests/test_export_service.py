import zipfile
import gzip
import json
import pytest
from pathlib import Path
import pytest
from api.services.export_service import (
    _package_outputs,
    _export_intensity_plot
)
from api.models.export_request import ExportRequest, Selection

import api.services.export_service as export_service
from api.services.export_service import (
    _export_intensity_data,
    _export_levels_data,
    _export_groups_data,
    _get_measurement_data,
    _get_saved_analysis
)
from api.legacy.models.level import LevelData

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

    def test_intensity_data(self,tmp_path):
        intensity_request = make_request(export_intensity=True, bin_size_ms=10) 
        raw = {"channel2": {"abstimes": [1,2,3]}, "name": "raw"}
        outpt_file = tmp_path / "intensity.csv"
        outpt_file.write_text("fake")

        def fake_trace(abstimes, output_path, fmt, bin_size_ms, measurement_name):
            assert bin_size_ms == 10
            return outpt_file

        original = export_service.exporters.export_intensity_trace 
        export_service.exporters.export_intensity_trace = fake_trace

        try:
            path, name = _export_intensity_data(intensity_request, raw, 2, "m1")
        finally:
            export_service.exporters.export_intensity_trace = original

        assert path == outpt_file
        assert name == "m1_intensity.csv"


class TestExportLevelsData:

    def test_uncheckedBox_levels_data(self):
        levels_request = make_request(export_levels=False)
        analysis = {"levels": {"levels": [{"id": 1}]}} 
        assert _export_levels_data(levels_request, analysis, "m1") is None

    def test_noLevels_in_analysis(self):
        levels_request = make_request(export_levels=True)
        assert _export_levels_data(levels_request, {"levels": None}, "m1") is None

    
    def test_levels_data(self,tmp_path):
        levels_request = make_request(export_levels=True) 
        analysis = {"levels": {"levels": [{"start_index":0, "end_index": 10, "start_time_ns":0, "end_time_ns": 1_000_000, "num_photons": 5, "intensity_cps": 50.0,}]}}
        outpt_file = tmp_path / "levels.csv"
        outpt_file.write_text("fake")

        def fake_export_levels(levels, output_path, fmt, measurement_name):
            return outpt_file

        original_exporter = export_service.exporters.export_levels 
        export_service.exporters.export_levels = fake_export_levels

        try:
            path, name = _export_levels_data(levels_request, analysis, "m1")
        finally:
            export_service.exporters.export_levels = original_exporter

        assert path == outpt_file
        assert name == "m1_levels.csv"




   


class TestExportGroupsData:
    def test_uncheckedBox_groups_data(self):
        groups_request = make_request(export_groups=False)
        analysis = {"groups": {"selected_step_index": 0, "steps": [{"groups": []}]}} 
        assert _export_groups_data(groups_request, analysis, "m1") is None


    def test_groups_data(self, tmp_path):
        groups_request = make_request(export_groups= True)
        analysis = {
            "groups" :{
                "selected_step_index": 1,
                "steps" : [
                    {"groups": [{"wrong": "step"}]},
                    {"groups": [{"group_id": 1, "total_photons": 10, "total_dwell_time_s": 1.0, "intensity_cps": 100.0, "level_indices": [0,1],}]},
                ],
            }
         }
        outpt_file = tmp_path / "groups.csv"

        def fake_export_groups(groups, output_path, fmt, measurement_name):
            assert groups[0].group_id == 1
            return outpt_file

        original = export_service.exporters.export_groups
        export_service.exporters.export_groups = fake_export_groups
        try:
            path, name = _export_groups_data(groups_request, analysis, "m1")
        finally:
            export_service.exporters.export_groups = original

        assert path == outpt_file
        assert name == "m1_groups.csv"
        

   
    
    
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


class TestGetMeasurementData:
    def test_cache_returnsData(self):
        fake_meas= { "id" : "m1", "value":42}

        def redisGetFunc_fake(key):
            return json.dumps(fake_meas)

        originalRedis = export_service.redisClient.get
        export_service.redisClient.get = redisGetFunc_fake

        try:
            result = _get_measurement_data("u1", "m1", "user1")

        finally:
            export_service.redisClient.get = originalRedis
        assert result == fake_meas


class TestGetSAvedAnalysis:
    def test_no_matchingSession_error(self):
          
        def fake_session(user_id):
            return [{"dataset_ref": "other_upload", "created_at": "2026-01-01"}]
    
        originalFunc= export_service.get_sessions
        export_service.get_sessions = fake_session
    
        try:
            with pytest.raises(NotImplementedError):
                _get_saved_analysis("u1", "m1", "user1")
    
    
        finally:
            export_service.get_sessions = originalFunc


    def test_wrong_measID_error(self):
              
        wrngFake_session=[
            {"dataset_ref": "u1", "created_at": "2026-01-01", 
                "results": {"levels": {"measurement_id": "different_measurement"},
                "groups": {},
                },
            }
        ]
        def fake_sessionList(user_id):
            return wrngFake_session
        
        originalFunc= export_service.get_sessions
        export_service.get_sessions = fake_sessionList
    
        try:
            with pytest.raises(NotImplementedError):
                _get_saved_analysis("u1", "m1", "user1")
    
    
        finally:
            export_service.get_sessions = originalFunc




    def test_latestMatching_session_returned(self):
                
            oldTOnew_Fake_session=[
                {"dataset_ref": "u1", "created_at": "2026-01-01", 
                    "results": {"levels": {"measurement_id": "m1", "data": "old",},
                    "groups": {"data": "old_groups",},
                    },
                },
                {"dataset_ref": "u1", "created_at": "2026-06-01", 
                    "results": {"levels": {"measurement_id": "m1", "data": "new",},
                    "groups": {"data": "new_groups"},
                    },
                },                
            ]
            def fake_sessionList(user_id):
                return oldTOnew_Fake_session
            
            originalFunc= export_service.get_sessions
            export_service.get_sessions = fake_sessionList
        
            try:
                result = _get_saved_analysis("u1", "m1", "user1")
        
        
            finally:
                export_service.get_sessions = originalFunc

            assert result["levels"]["data"] == "new"
            assert result["groups"]["data"] == "new_groups"


class TestExportIntensityPlot:
    def test_uncheckedBox_IntensityPlot(self):
        request = make_request(plot_intensity = False)
        data = {"channel1": {"abstimes": [1,2,3]}, "name": "raw"}

        def analysisGetter_fake():
            return {"levels": None, "groups": None}

        assert _export_intensity_plot(
            request, data, 1, analysisGetter_fake, "m1"
        )is None


        def test_intensityPlot_noLevelsGroups(self, tmp_path):
            request = make_request(plot_intensity = True)
            data = {"channel1": {"abstimes": [1,2,3]}, "name": "raw"}

            outpt_file = tmp_path / "plot.png"
            outpt_file.write_text("fake")

            def analysisGetter_fake():
                raise AssertionError( "should not be called when levels/groups are not requested")

            def fake_export_plot(abstimes, outpt_path, fmt, dpi, bin_size_ms, title, levels, groups, show_levels, show_groups):
                assert levels is None
                assert groups is None
                assert show_levels is False
                assert show_groups is False
                return outpt_file

            original = export_service.plot_exporters.export_intensity_plot
            export_service.plot_exporters.export_intensity_plot = fake_export_plot

            try:
                path,name = _export_intensity_plot(
                    request, data, 1, analysisGetter_fake, "m1"
                )
            finally:
                export_service.plot_exporters.export_intensity_plot = original

            assert path == outpt_file
            assert name == "m1_intensity_plot.png"
                        




        