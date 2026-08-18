import zipfile
import gzip
import json
import pytest
from pathlib import Path
import pytest

from api.models.export_request import ExportRequest, Selection

import api.services.export_service as export_service
from api.services.export_service import (
    _export_intensity_data,
    _export_levels_data,
    _export_groups_data,
    _get_measurement_data,
    _get_saved_analysis,
    _package_outputs,
    _export_intensity_plot,
    _export_bic_plot
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

class TestGetMeasurementDataBackup:
    def test_missedCache_inBackup(self, tmp_path ):
        backup_file = tmp_path / "measurements.json.gz"
        measurements = [
            {"id": "m1", "value": 1},
            {"id": "m2", "value": 2}
        ]

        with gzip.open(backup_file, "wt", encoding="utf-8") as f:
            json.dump(measurements, f)

        def fake_redisGet(key):
            return None

        def fake_keyBuild(user_id, upload_id, filename):
            return "some/storage/key"

        def fake_download(storage_key, file_extension):
            return backup_file

        originalRedis = export_service.redisClient.get
        original_keyBuild = export_service.build_storage_key
        original_download = export_service.download_to_temp

        export_service.redisClient.get = fake_redisGet
        export_service.build_storage_key = fake_keyBuild
        export_service.download_to_temp = fake_download

        try:
            result = _get_measurement_data("u1", "m2", "user1")
        finally:
            export_service.redisClient.get = originalRedis
            export_service.build_storage_key = original_keyBuild
            export_service.download_to_temp = original_download

        assert result == {"id": "m2", "value": 2}

    def test_missedCache_not_inBackup(self, tmp_path ):
            backup_file = tmp_path / "measurements.json.gz"
            measurements = [
                {"id": "m1", "value": 1},
            ]
    
            with gzip.open(backup_file, "wt", encoding="utf-8") as f:
                json.dump(measurements, f)
    
            def fake_redisGet(key):
                return None
    
            def fake_keyBuild(user_id, upload_id, filename):
                return "some/storage/key"
    
            def fake_download(storage_key, file_extension):
                return backup_file
    
            originalRedis = export_service.redisClient.get
            original_keyBuild = export_service.build_storage_key
            original_download = export_service.download_to_temp
    
            export_service.redisClient.get = fake_redisGet
            export_service.build_storage_key = fake_keyBuild
            export_service.download_to_temp = fake_download
    
            try:
                with pytest.raises(ValueError):
                    _get_measurement_data("u1", "does_not_exist", "user1")
            finally:
                export_service.redisClient.get = originalRedis
                export_service.build_storage_key = original_keyBuild
                export_service.download_to_temp = original_download
    
    


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

        def fake_export_plot(abstimes, output_path, fmt, dpi, bin_size_ms, title, levels, groups, show_levels, show_groups):
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


    def test_intensityPlot_withLevelsGroups(self, tmp_path):
            request = make_request(plot_intensity = True)
            request.plotIntensity_levels = True
            request.plotIntensity_groups = True
            data = {"channel1": {"abstimes": [1,2,3]}, "name": "raw"}
    
            outpt_file = tmp_path / "plot.png"
            outpt_file.write_text("fake")

            analysis = {
                "levels": {"levels": [{"start_index": 0, "end_index": 10, "start_time_ns": 0, "end_time_ns": 1_000_000, "num_photons": 5, "intensity_cps": 50.0}]},
                "groups": {"selected_step_index": 0, "steps": [{"groups": [{"group_id": 1, "total_photons": 10, "total_dwell_time_s": 1.0, "intensity_cps": 100.0, "level_indices": [0]}]}]},
            }
    
            def analysisGetter_fake():
                return analysis
    
            def fake_export_plot(abstimes, output_path, fmt, dpi, bin_size_ms, title, levels, groups, show_levels, show_groups):
                assert len(levels) == 1
                assert len(groups) == 1
                assert show_levels is True
                assert show_groups is True
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

class TestExportBicPlot:
    def test_uncheckedBox_bicPlot(self):
        request = make_request(plot_bic = False)
        data = {"name": "raw"}

        def analysisGetter_fake():
            raise AssertionError( "should not be called when plot_bic is unchecked")

        assert _export_bic_plot(
            request, analysisGetter_fake, data, "m1"
        )is None

    def test_bicPlot_noGroups(self):
            request = make_request(plot_bic = True)
            data = {"name": "raw"}
    
            def analysisGetter_fake():
                return{"levels": None, "groups": None}
    
            assert _export_bic_plot(
                request, analysisGetter_fake, data,"m1"
            )is None

    def test_bicPlot_successfulExport(self, tmp_path):
        request = make_request(plot_bic = True)
        data = {"name": "raw"}

        outpt_file = tmp_path / "bic.png"
        outpt_file.write_text("fake")
        
        analysis = {
            "levels": None,
            "groups": {"selected_step_index": 0, "optimal_step_index": 0, "num_original_levels": 3,  
                       "steps": [{"groups": [{"group_id": 1, "total_photons": 10, "total_dwell_time_s": 1.0, "intensity_cps": 100.0, "level_indices": [0]}],
                                "level_group_assignments": [0],
                                "bic": 123.4,
                                "num_groups":1}]}
        }

        def analysisGetter_fake():
            return analysis

        def fake_export_bic_plot(clustering_result, output_path, fmt, dpi, title):
            assert clustering_result.selected_step_index == 0
            assert clustering_result.num_original_levels == 3
            return outpt_file

        original = export_service.plot_exporters.export_bic_plot
        export_service.plot_exporters.export_bic_plot = fake_export_bic_plot

        try:
            path, name = _export_bic_plot(
                request, analysisGetter_fake,
                data,
                "m1"
            )
        finally:
            export_service.plot_exporters.export_bic_plot = original

        assert path == outpt_file
        assert name == "m1_bic_plot.png"


class TestProcessSelection:
    def test_intensityOnly_noAnalysis(self):
        request = make_request(export_intensity=True)
        selection = Selection(measurement_id="m1", channel=1)

        fake_data= {
            "channel1": {"abstimes": [1, 2, 3]},
            "name": "raw"
        }

        def getMeasurement_data_fake(upload_id, measurement_id, user_id):
            return fake_data

        def intensity_data_fake(req, data, channel, name):
            return (Path("intensity.csv"), "m1_intensity.csv")

        def intensity_plot_fake(req, data, channel, analysis_getter, name):
            return None

        def bic_plot_fake(req, analysis_getter, data, name):
            return None

        def get_saved_analysis_fake(upload_id, measurement_id, user_id):
            raise AssertionError("shouldn't be called when levels and groups as well as plots aren't requested")



        original_getMeasurement = export_service._get_measurement_data
        original_intensityData= export_service._export_intensity_data
        original_intensityPlot = export_service._export_intensity_plot
        original_bicPlot = export_service._export_bic_plot
        original_getAnalysis = export_service._get_saved_analysis

        export_service._get_measurement_data = getMeasurement_data_fake
        export_service._export_intensity_data = intensity_data_fake
        export_service._export_intensity_plot = intensity_plot_fake
        export_service._export_bic_plot = bic_plot_fake
        export_service._get_saved_analysis = get_saved_analysis_fake


        try:
            results = export_service._process_selection(request, selection, "user1")

        finally:
            export_service._get_measurement_data = original_getMeasurement
            export_service._export_intensity_data = original_intensityData
            export_service._export_intensity_plot = original_intensityPlot
            export_service._export_bic_plot = original_bicPlot
            export_service._get_saved_analysis = original_getAnalysis

        assert results == [
            (Path("intensity.csv"), "m1_intensity.csv")
        ]


    def test_savedAnalaysis_singleCall(self):
        request = make_request(export_levels=True, export_groups=True)
        selection = Selection(measurement_id="m1", channel=1)

        fake_data= {
            "channel1": {"abstimes": [1, 2, 3]},
            "name": "raw"
        }

        call_count = {"n": 0}

        def getMeasurement_data_fake(upload_id, measurement_id, user_id):
            return fake_data

        def get_saved_analysis_fake(upload_id, measurement_id, user_id):
            call_count["n"] += 1

            return {
                "levels": {"levels":[]},
                "groups": {
                    "selected_step_index":0,
                    "steps":[{"groups": []}]
                }
            }

        def intensity_data_fake(req, data, channel, name):
            return None

        def levelsData_fake(req, analysis, name):
            return (Path("levels.csv"),"m1_levels.csv")

        def groupsData_fake(req, analysis, name):
            return (Path("groups.csv"),"m1_groups.csv")

        def intensity_plot_fake(req, data, channel, analysis_getter, name):
            analysis_getter()
            return None

        def bic_plot_fake(req, analysis_getter, data, name):
            analysis_getter()
            return None

        



        original_getMeasurement = export_service._get_measurement_data
        original_getAnalysis = export_service._get_saved_analysis
        original_intensityData= export_service._export_intensity_data
        original_levelsData = export_service._export_levels_data
        original_groupsData = export_service._export_groups_data
        original_intensityPlot = export_service._export_intensity_plot
        original_bicPlot = export_service._export_bic_plot
        

        export_service._get_measurement_data = getMeasurement_data_fake
        export_service._get_saved_analysis = get_saved_analysis_fake
        export_service._export_intensity_data = intensity_data_fake
        export_service._export_levels_data = levelsData_fake
        export_service._export_groups_data = groupsData_fake
        export_service._export_intensity_plot = intensity_plot_fake
        export_service._export_bic_plot = bic_plot_fake


        try:
            results = export_service._process_selection(request, selection, "user1")

        finally:
            export_service._get_measurement_data = original_getMeasurement
            export_service._get_saved_analysis = original_getAnalysis
            export_service._export_intensity_data = original_intensityData
            export_service._export_levels_data = original_levelsData
            export_service._export_groups_data = original_groupsData
            export_service._export_intensity_plot = original_intensityPlot
            export_service._export_bic_plot = original_bicPlot
            

        assert (Path("levels.csv"),"m1_levels.csv") in results
        assert (Path("groups.csv"),"m1_groups.csv") in results
        assert call_count["n"] == 1

class TestClusteringResult:

    def test_buildsCorrectResult(self):
        analysis = {"groups": {"optimal_step_index": 1, "selected_step_index": 0, "num_original_levels": 5,
                               "steps": [{
                                   "groups": [{"group_id": 1, "total_photons": 10, "total_dwell_time_s": 1.0, "intensity_cps": 100.0, "level_indices": [0]}],
                                   "level_group_assignments": [0],
                                   "bic": 111.1,
                                   "num_groups": 1,
                               },
                               {"groups": [{"group_id": 2, "total_photons": 20, "total_dwell_time_s": 2.0, "intensity_cps": 150.0, "level_indices": [1]}], "level_group_assignments": [0, 1], "bic": 222.2, "num_groups": 1,},
                            ],
                        }
                    }

        result = export_service.clustering_result(analysis)

        assert result.optimal_step_index == 1
        assert result.selected_step_index == 0
        assert result.num_original_levels == 5
        assert len(result.steps) == 2
        assert result.steps[0].bic == 111.1
        assert result.steps[0].groups[0].group_id == 1
        assert result.steps[1].num_groups == 1

class TestExportData:
    def test_export_process_multipleSelections(self):
        request = make_request(
            selections=[
                Selection(measurement_id="m1", channel=1),
                Selection(measurement_id="m2", channel=1),
            ]
        )
        calls=[]

        def processSelection_fake(req, selection, user_id):
            calls.append(selection.measurement_id)
            return [(Path(f"{selection.measurement_id}.csv"), f"{selection.measurement_id}.csv")]

        def packageOutputs_fake(output_paths, req):
            assert len(output_paths) == 2
            return (Path("final.zip"), "final.zip")

        originalProcess = export_service._process_selection
        originalPackage = export_service._package_outputs

        export_service._process_selection = processSelection_fake
        export_service._package_outputs= packageOutputs_fake

        try:
            result = export_service.export_data(request, "user1")
        finally:
            export_service._process_selection = originalProcess
            export_service._package_outputs= originalPackage

        assert calls == ["m1", "m2"]
        assert result == (Path("final.zip"), "final.zip")


                        




        