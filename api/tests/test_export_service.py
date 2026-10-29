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
    _export_fits_data,
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
        with pytest.raises(export_service.MissingAnalysisDataError): 
            _export_levels_data(levels_request, {"levels": None}, "m1") 

    
    def test_levels_data(self,tmp_path):
        levels_request = make_request(export_levels=True) 
        analysis = {"levels": {"levels": [{"start_index":0, "end_index": 10, "start_time_ns":0, "end_time_ns": 1_000_000, "num_photons": 5, "intensity_cps": 50.0,}]}}
        outpt_file = tmp_path / "levels.csv"
        outpt_file.write_text("fake")

        def fake_export_levels(levels, output_path, fmt, measurement_name, level_fits=None):
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

        def fake_export_groups(groups, output_path, fmt, measurement_name, group_fits=None):
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

    def test_noGroupsAnalysis(self):
        groups_request = make_request(export_groups=True)
        with pytest.raises(export_service.MissingAnalysisDataError):
            _export_groups_data(groups_request, {"groups": None}, "m1")


class TestExportFitsData:
    def test_uncheckedBox_lifetime(self):
        fits_request = make_request(export_fits=False)
        analysis = {"fits": {"tau": [1.0]}}
        assert _export_fits_data(fits_request, analysis, "m1", 1, "m1") is None

    def test_noFits_analysis(self):
        fits_request=make_request(export_fits=True)
        with pytest.raises(export_service.MissingAnalysisDataError):
            _export_fits_data(fits_request, {"fits": None}, "m1", 1, "m1") 

    def test_fitsData(self, tmp_path):
        fits_request=make_request(export_fits=True)
        analysis = {
            "fits": {
                "tau": [5.6169],
                "tau_std": [0.1341],
                "amplitude": [1.0],
                "amplitude_std": [0.0],
                "shift": 23.7917,
                "shift_std": 0.0,
                "chi_squared": 1391.1055,
                "durbin_watson": 0.0211,
                "dw_bounds": None,
                "residuals": [0.1, 0.2, 0.3],
                "fitted_curve": [1.0, 2.0, 3.0],
                "fit_start_index": 0,
                "fit_end_index": 3,
                "background": 0.6818,
                "num_exponentials": 1,
                "average_lifetime": 5.6169,
                "fitted_irf_fwhm": None,
                "fitted_irf_fwhm_std": None,
            }
        }
        outpt_file =tmp_path/ "fits.csv"
        outpt_file.write_text("fake")

        def fake_export_fitResults(fit_results, output_path, fmt):
            key = list(fit_results.keys())[0]
            assert key == (7, 1, -1)
            assert fit_results[key].chi_squared == 1391.1055
            return outpt_file

        original = export_service.exporters.export_fit_results
        export_service.exporters.export_fit_results = fake_export_fitResults

        try:
            path, name = _export_fits_data(fits_request, analysis, "7", 1, "m1")
        finally:
            export_service.exporters.export_fit_results = original

        assert path == outpt_file
        assert name == "m1_fits.csv"

    
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

    def test_fits_Withcategory(self, tmp_path) :
        path1= make_test_output(tmp_path, name="first.csv")
        path2= make_test_output(tmp_path, name="second.csv")

        request = make_request(export_fits=True)

        output_paths = [ (path1, "first.csv"), (path2, "second.csv"),]

        _, result_name= _package_outputs(output_paths, request)

        assert "fits" in result_name


class TestGetMeasurementData:
    def test_cache_returnsData(self):
        fake_meas= { "id" : "m1", "value":42}

        original_get = export_service.get_cached_measurement
        export_service.get_cached_measurement = lambda u, m: fake_meas

        try:
            result = _get_measurement_data("u1", "m1", "user1")
        finally:
            export_service.get_cached_measurement = original_get
        assert result == fake_meas

class TestGetMeasurementDataBackup:
    def test_missedCache_callsFallback(self):
        fake_meas = {"id": "m2", "value": 2}

        original_get = export_service.get_cached_measurement
        original_fallback = export_service.cache_fallback_service

        export_service.get_cached_measurement = lambda u, m: None
        export_service.cache_fallback_service = lambda u, m: fake_meas

        try:
            result = _get_measurement_data("u1", "m2", "user1")
        finally:
            export_service.get_cached_measurement = original_get
            export_service.cache_fallback_service = original_fallback

        assert result == fake_meas

    def test_missedCache_notFound_raisesError(self):
        original_get = export_service.get_cached_measurement
        original_fallback = export_service.cache_fallback_service

        export_service.get_cached_measurement = lambda u, m: None
        export_service.cache_fallback_service = lambda u, m: None

        try:
            with pytest.raises(ValueError):
                _get_measurement_data("u1", "does_not_exist", "user1")
        finally:
            export_service.get_cached_measurement = original_get
            export_service.cache_fallback_service = original_fallback
    
    


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
    
            with pytest.raises(export_service.MissingAnalysisDataError):
                _export_bic_plot(request, analysisGetter_fake, data,"m1")

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

        def get_saved_analysis_fake(upload_id, measurement_id, user_id, channel=1):
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

        def get_saved_analysis_fake(upload_id, measurement_id, user_id, channel=1):
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

        def levelsData_fake(req, analysis, name, measurement_id=None, channel=1):
            return (Path("levels.csv"),"m1_levels.csv")

        def groupsData_fake(req, analysis, name, measurement_id=None, channel=1):
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

    def test_fits_processSelection(self):
            request = make_request(export_fits=True)
            selection = Selection(measurement_id="7", channel=1)
    
            fake_data= {
                "channel1": {"abstimes": [1, 2, 3]},
                "name": "raw"
            }
    
            def getMeasurement_data_fake(upload_id, measurement_id, user_id):
                return fake_data

            def get_saved_analysis_fake(upload_id, measurement_id, user_id, channel=1):
                return {"levels": None, "groups":None, "fits": {"tau": [1.0]}}
    
            def intensity_data_fake(req, data, channel, name):
                return None

            def fitsData_fake(req, analysis, measurement_id, channel, name):
                return (Path("fits.csv"), "m1_fits.csv")
    
            def intensity_plot_fake(req, data, channel, analysis_getter, name):
                return None
    
            def bic_plot_fake(req, analysis_getter, data, name):
                return None
    
    
    
            original_getMeasurement = export_service._get_measurement_data
            original_intensityData= export_service._export_intensity_data
            original_fitsData = export_service._export_fits_data
            original_intensityPlot = export_service._export_intensity_plot
            original_bicPlot = export_service._export_bic_plot
            original_getAnalysis = export_service._get_saved_analysis
    
            export_service._get_measurement_data = getMeasurement_data_fake
            export_service._export_intensity_data = intensity_data_fake
            export_service._export_fits_data = fitsData_fake
            export_service._export_intensity_plot = intensity_plot_fake
            export_service._export_bic_plot = bic_plot_fake
            export_service._get_saved_analysis = get_saved_analysis_fake
    
    
            try:
                results = export_service._process_selection(request, selection, "user1")
    
            finally:
                export_service._get_measurement_data = original_getMeasurement
                export_service._export_intensity_data = original_intensityData
                export_service._export_fits_data = original_fitsData
                export_service._export_intensity_plot = original_intensityPlot
                export_service._export_bic_plot = original_bicPlot
                export_service._get_saved_analysis = original_getAnalysis
    
            assert (Path("fits.csv"), "m1_fits.csv") in results

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


class TestExportIntegration:
    def test_realIntensityData_Export(self, tmp_path):
        intensity_request = make_request(upload_id="upload123", export_intensity=True, bin_size_ms=10, selections=[Selection(measurement_id="m1", channel=1)])

        fake_meas={
            "name": "raw", 
            "channel1": {"abstimes": [1000, 2000, 3000, 15000, 16000]},
        } 

        original_get = export_service.get_cached_measurement
        export_service.get_cached_measurement = lambda u, m: fake_meas

        try:
            resultPath, resultName = export_service.export_data(intensity_request, "user1")
        finally:
            export_service.get_cached_measurement = original_get

        assert resultPath.exists()
        assert resultName == "raw_intensity.csv"

        content = resultPath.read_text()
        assert len(content) > 0


    def test_reallevels_Export(self, tmp_path):
        levels_request = make_request(upload_id="upload123", export_levels=True, selections=[Selection(measurement_id="m1", channel=1)])

        fake_meas={
            "name": "raw", 
            "channel1": {"abstimes": [1000, 2000, 3000]},
        } 
        fake_session=[
            {"dataset_ref": "upload123", "created_at": "2026-01-01", 
                "results": {"levels": {"measurement_id": "m1", 
                                        "levels": [{
                                            "start_index": 0,
                                            "end_index": 10,
                                            "start_time_ns": 0,
                                            "end_time_ns": 5,
                                            "num_photons": 5,
                                            "intensity_cps": 50.0,
                                        }],},
                "groups": None,
                },
            }
        ]

        def fake_getSession(user_id):
            return fake_session

        original_get = export_service.get_cached_measurement
        original_getSessions = export_service.get_sessions

        export_service.get_cached_measurement = lambda u, m: fake_meas
        export_service.get_sessions = fake_getSession

        try:
            resultPath, resultName = export_service.export_data(levels_request, "user1")
        finally:
            export_service.get_cached_measurement = original_get
            export_service.get_sessions = original_getSessions

        assert resultPath.exists()
        assert resultName == "raw_levels.csv"

        content = resultPath.read_text()
        assert len(content) > 0


    




                        




        

def _saved_fit(num_exponentials=1, tau=2.0, **overrides):
    fit = {
        "times": [0.0, 0.1, 0.2, 0.3],
        "counts": [5, 100, 50, 20],
        "tau": [tau] * num_exponentials,
        "tau_std": [0.1] * num_exponentials,
        "amplitude": [1.0 / num_exponentials] * num_exponentials,
        "amplitude_std": [0.0] * num_exponentials,
        "shift": 0.05,
        "shift_std": 0.0,
        "chi_squared": 1.1,
        "durbin_watson": 1.9,
        "dw_bounds": None,
        "residuals": [None, 0.1, -0.2, 0.3],
        "fitted_curve": [None, 99.0, 51.0, 19.0],
        "fit_start_index": 1,
        "fit_end_index": 4,
        "background": 1.0,
        "num_exponentials": num_exponentials,
        "average_lifetime": tau,
        "fitted_irf_fwhm": None,
        "fitted_irf_fwhm_std": None,
        "irf": [0.0, 10.0, 2.0, 0.0],
    }
    fit.update(overrides)
    return fit


def _levels(*ranges):
    return {"levels": [{"start_index": s, "end_index": e} for s, e in ranges]}


class TestPerTargetFitExport:
    def test_exports_measurement_and_level_fits_for_selection_only(self, tmp_path):
        analysis = {
            "levels": _levels((0, 9), (10, 19)),
            "fit_results_by_target": {
                "upload123:7:1:full": _saved_fit(tau=3.0),
                "upload123:7:1:10-19": _saved_fit(tau=1.5),
                "upload123:7:2:full": _saved_fit(tau=9.0),
                "upload123:8:1:full": _saved_fit(tau=8.0),
            },
        }
        captured = {}

        def fake_export_fit_results(fit_results, output_path, fmt):
            captured.update(fit_results)
            return tmp_path / "fits.csv"

        original = export_service.exporters.export_fit_results
        export_service.exporters.export_fit_results = fake_export_fit_results
        try:
            _export_fits_data(make_request(export_fits=True), analysis, "7", 1, "m7")
        finally:
            export_service.exporters.export_fit_results = original

        assert sorted(captured) == [(7, 1, -1), (7, 1, 1)]
        assert captured[(7, 1, -1)].tau == (3.0,)
        assert captured[(7, 1, 1)].tau == (1.5,)

    def test_legacy_single_fit_is_skipped_for_other_measurement(self):
        analysis = {
            "levels": None,
            "fits": _saved_fit(),
            "current_fit_key": "upload123:8:1:full",
        }
        with pytest.raises(export_service.MissingAnalysisDataError):
            _export_fits_data(make_request(export_fits=True), analysis, "7", 1, "m7")

    def test_levels_export_includes_level_fits(self, tmp_path):
        analysis = {
            "levels": {"levels": [
                {"start_index": 0, "end_index": 9, "start_time_ns": 0, "end_time_ns": 10,
                 "num_photons": 10, "intensity_cps": 1000.0},
            ]},
            "fit_results_by_target": {
                "upload123:7:1:0-9": _saved_fit(tau=2.5),
                "upload123:7:1:full": _saved_fit(tau=4.0),
            },
        }
        captured = {}

        def fake_export_levels(levels, output_path, fmt, measurement_name, level_fits=None):
            captured["level_fits"] = level_fits
            return tmp_path / "levels.csv"

        original = export_service.exporters.export_levels
        export_service.exporters.export_levels = fake_export_levels
        try:
            _export_levels_data(make_request(export_levels=True), analysis, "m7", "7", 1)
        finally:
            export_service.exporters.export_levels = original

        assert list(captured["level_fits"]) == [0]
        assert captured["level_fits"][0].tau == (2.5,)


class TestSavedAnalysisPerMeasurement:
    def test_levels_come_from_cpa_results_and_groups_only_for_current(self):
        sessions = [{
            "dataset_ref": "u1",
            "created_at": "2026-01-01",
            "results": {
                "levels": {"measurement_id": "m1", "levels": []},
                "cpaResults": {"m2": {"measurement_id": "m2", "levels": [{"start_index": 0}]}},
                "groups": {"data": "m1 groups"},
                "fitResultsByTarget": {"u1:m2:1:full": {"tau": [1.0]}},
            },
        }]
        original = export_service.get_sessions
        export_service.get_sessions = lambda user_id: sessions
        try:
            result = _get_saved_analysis("u1", "m2", "user1")
        finally:
            export_service.get_sessions = original

        assert result["levels"]["measurement_id"] == "m2"
        assert result["groups"] is None
        assert "u1:m2:1:full" in result["fit_results_by_target"]


class TestExportDecayPlot:
    def test_uses_saved_fit_window_and_shifted_irf(self, tmp_path):
        analysis = {"levels": None, "fit_results_by_target": {"upload123:7:1:full": _saved_fit()}}
        captured = {}

        def fake_export_decay_plot(**kwargs):
            captured.update(kwargs)
            return tmp_path / "decay.png"

        original = export_service.plot_exporters.export_decay_plot
        export_service.plot_exporters.export_decay_plot = fake_export_decay_plot
        try:
            _, name = export_service._export_decay_plot(
                make_request(plot_decay=True), {"name": "m7"}, 1, lambda: analysis, "7", "m7"
            )
        finally:
            export_service.plot_exporters.export_decay_plot = original

        assert name == "m7_decay_plot.png"
        assert list(captured["fit_result"].fitted_curve) == [99.0, 51.0, 19.0]
        assert list(captured["irf_t"]) == pytest.approx([0.05, 0.15, 0.25, 0.35])
        assert captured["show_irf"] is True

    def test_without_fit_builds_histogram_from_microtimes(self, tmp_path):
        captured = {}

        def fake_export_decay_plot(**kwargs):
            captured.update(kwargs)
            return tmp_path / "decay.png"

        original = export_service.plot_exporters.export_decay_plot
        export_service.plot_exporters.export_decay_plot = fake_export_decay_plot
        try:
            export_service._export_decay_plot(
                make_request(plot_decay=True, plotDecay_fit=False, plotDecay_irf=False),
                {"name": "m7", "channelwidth": 0.1, "channel1": {"microtimes": [0.05, 0.15, 0.15]}},
                1, lambda: {}, "7", "m7",
            )
        finally:
            export_service.plot_exporters.export_decay_plot = original

        assert captured["fit_result"] is None
        assert captured["counts"].sum() == 3


def _group_analysis(fit_results_by_target):
    return {
        "levels": {"levels": [
            {"start_index": 0, "end_index": 9},
            {"start_index": 10, "end_index": 19},
            {"start_index": 20, "end_index": 29},
        ]},
        "groups": {
            "selected_step_index": 0,
            "steps": [{"groups": [
                {"group_id": 0, "level_indices": [2, 0], "total_photons": 20,
                 "total_dwell_time_s": 2.0, "intensity_cps": 10.0},
                {"group_id": 1, "level_indices": [1], "total_photons": 10,
                 "total_dwell_time_s": 1.0, "intensity_cps": 10.0},
            ]}],
        },
        "fit_results_by_target": fit_results_by_target,
    }


class TestGroupFitExport:
    def test_group_key_uses_sorted_photon_ranges(self):
        levels = _group_analysis({})["levels"]["levels"]
        assert export_service._group_fit_key({"level_indices": [2, 0]}, levels) == "group[0-9,20-29]"
        assert export_service._group_fit_key({"level_indices": [5]}, levels) is None

    def test_group_fits_match_selected_step_and_stay_out_of_level_fits(self):
        analysis = _group_analysis({
            "upload123:7:1:group[0-9,20-29]": _saved_fit(tau=4.2),
            "upload123:7:1:group[0-9]": _saved_fit(tau=9.9),  # group from another grouping run
            "upload123:7:1:10-19": _saved_fit(tau=1.0),
        })

        group_fits = export_service._collect_group_fit_dicts(analysis, "7", 1)
        level_fits = export_service._collect_fit_dicts(analysis, "7", 1)

        assert list(group_fits) == [0]
        assert group_fits[0]["tau"] == [4.2]
        assert list(level_fits) == [1]

    def test_group_fits_written_to_their_own_file(self, tmp_path):
        analysis = _group_analysis({"upload123:7:1:group[10-19]": _saved_fit(tau=3.3)})
        captured = {}

        def fake_export_fit_results(fit_results, output_path, fmt):
            captured.update(fit_results)
            return tmp_path / "group_fits.csv"

        original = export_service.exporters.export_fit_results
        export_service.exporters.export_fit_results = fake_export_fit_results
        try:
            request = make_request(export_fits=True)
            assert _export_fits_data(request, analysis, "7", 1, "m7") is None
            _, name = export_service._export_group_fits_data(request, analysis, "7", 1, "m7")
        finally:
            export_service.exporters.export_fit_results = original

        assert name == "m7_group_fits.csv"
        assert list(captured) == [(7, 1, 1)]

    def test_groups_csv_includes_tau_columns(self, tmp_path):
        analysis = _group_analysis({"upload123:7:1:group[0-9,20-29]": _saved_fit(tau=4.2)})
        request = make_request(export_groups=True)

        path, _ = _export_groups_data(request, analysis, "m7", "7", 1)

        rows = path.read_text().splitlines()
        assert rows[0].split(",")[:7] == [
            "group_id", "num_levels", "total_photons", "total_dwell_time_s",
            "intensity_cps", "level_indices", "tau_1_ns",
        ]
        assert rows[1].split(",")[5:7] == ["2;0", "4.2000"]
        assert rows[2].split(",")[6] == ""


class TestSavedAnalysisGroups:
    def test_groups_come_from_grouping_results_for_any_measurement(self):
        sessions = [{
            "dataset_ref": "u1",
            "created_at": "2026-01-01",
            "results": {
                "levels": {"measurement_id": "m1", "levels": []},
                "cpaResults": {"m2": {"measurement_id": "m2", "levels": []}},
                "groups": {"data": "m1 groups"},
                "groupingResults": {"m2": {"data": "m2 groups"}},
            },
        }]
        original = export_service.get_sessions
        export_service.get_sessions = lambda user_id: sessions
        try:
            result = _get_saved_analysis("u1", "m2", "user1")
        finally:
            export_service.get_sessions = original

        assert result["groups"] == {"data": "m2 groups"}
