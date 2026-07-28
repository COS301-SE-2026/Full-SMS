import json
import numpy as np
from unittest.mock import MagicMock, call, patch, ANY
from api.routes.analysis_routes import get_spectra_data
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.analysis_services.change_point_analysis import resolve_current_measurement
import pytest
from api.models.analysis_models import ClusteringReq, CpaReq, IntensityReq, IntensityRes, LifetimeReq, LifetimeRes, RasterScanReq
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.raster_scan import get_raster_scan_data
from dataclasses import dataclass
from api.services.analysis_services.clustering_job_service import clustering_job
from api.legacy.models.level import LevelData
from api.services.analysis_services.clustering import execute_clustering
from api.services.analysis_services.lifetime import lifetime_analysis

@patch("api.services.analysis_services.intensity.redisClient")
@patch("api.services.analysis_services.intensity.bin_photons")
@patch("api.services.analysis_services.intensity.compute_intensity_cps")
def test_intensity_analysis_cache_hit(mock_compute_intensity, mock_bin_photons, mock_redis):
    mock_request = IntensityReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767", 
        measurement_id="1", 
        bin_size_ms=10.0
    )

    mock_cached_dict = {
        "channel1": {
            "abstimes": [1e6, 2e6, 3e6]
        }
    }
    mock_redis.get.return_value = json.dumps(mock_cached_dict)

    times = np.array([0, 1, 2])
    counts = np.array([2, 5, 8]) 
    intensity_cps = np.array([200, 500, 800])
    
    mock_bin_photons.return_value = (times, counts)
    mock_compute_intensity.return_value = intensity_cps
    response = intensity_analysis(mock_request)

    assert isinstance(response, IntensityRes)
    assert response.time_bins == times.tolist()
    assert response.counts == counts.tolist()
    assert response.intensity_cps == intensity_cps.tolist()
    
    mock_redis.get.assert_called_once_with("raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    
    mock_bin_photons.assert_called_once_with(
        abstimes=ANY, 
        bin_size_ms=10.0
    )
    mock_compute_intensity.assert_called_once_with(
        counts=ANY, 
        bin_size_ms=10.0
    )
    

@patch("api.services.analysis_services.intensity.redisClient")
@patch("api.services.analysis_services.intensity.cache_fallback_service")
@patch("api.services.analysis_services.intensity.bin_photons")
@patch("api.services.analysis_services.intensity.compute_intensity_cps")
def test_intensity_analysis_cache_miss(mock_compute_intensity, mock_bin_photons, mock_cache_fallback, mock_redis):
    mock_request = IntensityReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1",
        bin_size_ms=10.0
    )

    mock_cached_dict = {
        "channel1": {
            "abstimes": [1e6, 2e6, 3e6]
        }
    }
    
    mock_redis.get.return_value = None
    
    mock_cache_fallback.return_value = json.dumps(mock_cached_dict)

    times = np.array([0, 1, 2])
    counts = np.array([2, 5, 8])
    intensity_cps = np.array([200, 500, 800])

    mock_bin_photons.return_value = (times, counts)
    mock_compute_intensity.return_value = intensity_cps

    response = intensity_analysis(mock_request)

    assert isinstance(response, IntensityRes)
    assert response.time_bins == times.tolist()
    assert response.counts == counts.tolist()
    assert response.intensity_cps == intensity_cps.tolist() 
    
    mock_redis.get.assert_called_once_with("raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767")
    

@patch("api.services.analysis_services.raster_scan.redisClient")
@patch("api.services.analysis_services.raster_scan.cache_fallback")
def test_raster_scan_data_cache_hit(mock_cache_fallback, mock_redis):
    mock_request = RasterScanReq(
        upload_id = "123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )

    mock_cached_dict = {
        "raster_scan": [[1, 2], [3, 4]],
        "raster_scan_coord": {"x": 10, "y": 20}
    }
    mock_redis.get.return_value = json.dumps(mock_cached_dict)

    response = get_raster_scan_data(mock_request)
    assert response["raster_scan"] == [[1, 2], [3, 4]]
    assert response["raster_scan_coord"] == {"x": 10, "y": 20}
    
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_not_called() #verify fallback was skipped
    

@patch("api.services.analysis_services.raster_scan.redisClient")
@patch("api.services.analysis_services.raster_scan.cache_fallback") 
def test_raster_scan_data_cache_miss(mock_cache_fallback, mock_redis):
    mock_request = RasterScanReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )

    mock_redis.get.return_value = None

    mock_fallback_dict = {
        "raster_scan": [[5, 6], [7, 8]],
        "raster_scan_coord": {"x": 50, "y": 60}
    }
    mock_cache_fallback.return_value = json.dumps(mock_fallback_dict)
    response = get_raster_scan_data(mock_request)
    assert response["raster_scan"] == [[5, 6], [7, 8]]
    assert response["raster_scan_coord"] == {"x": 50, "y": 60}
    
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767")

@dataclass
class DummyClusteringResponse:
    labels: list
    centers: list

@patch("api.services.analysis_services.clustering_job_service.cluster_levels")
def test_clustering_job_success(mock_cluster_levels):
    input_levels = [
            {
                "start_index": 0,
                "end_index": 100,
                "start_time_ns": 0,
                "end_time_ns": 1000000,
                "num_photons": 50,
                "intensity_cps": 50000.0
            },
            {
                "start_index": 100,
                "end_index": 200,
                "start_time_ns": 1000000,
                "end_time_ns": 2000000,
                "num_photons": 45,
                "intensity_cps": 45000.0
            }
        ]

    mock_response = DummyClusteringResponse(
        labels=[0, 1], 
        centers=[10.0, 11.0]
    )
    mock_cluster_levels.return_value = mock_response
    result = clustering_job(input_levels)

    assert result == {
        "labels": [0, 1],
        "centers": [10.0, 11.0]
    }
    
    mock_cluster_levels.assert_called_once_with(levels=ANY)
    
@patch("api.services.analysis_services.clustering_job_service.cluster_levels")
def test_clustering_job_value_error(mock_cluster_levels):
    input_levels = [
        {
            "start_index": 0,
            "end_index": 100,
            "start_time_ns": 0,
            "end_time_ns": 1000000,
            "num_photons": 50,
            "intensity_cps": 50000.0
        }
    ]

    mock_cluster_levels.return_value = None

    with pytest.raises(ValueError, match="At least 2 levels are needed to execute clustering"):
        clustering_job(input_levels)

    mock_cluster_levels.assert_called_once()
   
     
def generate_mock_level(index: int) -> LevelData:
    return LevelData(
        start_index=index * 100,
        end_index=(index + 1) * 100,
        start_time_ns=index * 1000000,
        end_time_ns=(index + 1) * 1000000,
        num_photons=50,
        intensity_cps=50000.0
    )


@patch("api.services.analysis_services.clustering.cluster_levels")
def test_execute_clustering_success(mock_cluster_levels):
    valid_levels = [generate_mock_level(0), generate_mock_level(1)]
    mock_request = ClusteringReq(levels=valid_levels)
    
    mock_response = MagicMock()
    mock_response.labels = [0, 1]
    mock_cluster_levels.return_value = mock_response
    result = execute_clustering(mock_request)
    assert result == mock_response
    mock_cluster_levels.assert_called_once_with(levels=valid_levels)

@patch("api.services.analysis_services.clustering.cluster_levels")
def test_execute_clustering_value_error(mock_cluster_levels):
    invalid_levels = [generate_mock_level(0)]
    mock_request = ClusteringReq(levels=invalid_levels)
    mock_cluster_levels.return_value = None

    with pytest.raises(ValueError, match="Need at least 2 levels"):
        execute_clustering(mock_request)

    mock_cluster_levels.assert_called_once_with(levels=invalid_levels)

def mock_cpa_res():
    mock_result = MagicMock()
    mock_result.num_change_points = 1
    mock_result.change_point_indices = np.array([50])
    mock_result.confidence_regions = [(45, 55)]
    
    # Reusing the LevelData structure we established earlier
    mock_level = LevelData(
        start_index=0,
        end_index=100,
        start_time_ns=0,
        end_time_ns=1000000,
        num_photons=50,
        intensity_cps=50000.0,
        group_id=1
    )
    mock_result.levels = [mock_level]
    return mock_result

@patch("api.services.analysis_services.change_point_analysis.redisClient")
@patch("api.services.analysis_services.change_point_analysis.cache_fallback_service")
@patch("api.services.analysis_services.change_point_analysis.find_change_points")
def test_resolve_current_measurement_cache_hit(mock_find_change_points, mock_cache_fallback, mock_redis):
    mock_request = CpaReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1",
        confidence=95.0 
    )

    mock_cached_dict = {
        "channel1": {
            "abstimes": [1e6, 2e6, 3e6]
        }
    }
    mock_redis.get.return_value = json.dumps(mock_cached_dict)

    mock_find_change_points.return_value = mock_cpa_res()

    response = resolve_current_measurement(mock_request)

    assert response["measurement_id"] == "1"
    assert response["num_change_points"] == 1
    assert response["change_point_indices"] == [50]
    assert response["confidence_regions"] == [(45, 55)]
    
    level = response["levels"][0]
    assert level["start_index"] == 0
    assert level["intensity_cps"] == 50000.0
    assert level["group_id"] == 1
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_not_called()
    
    mock_find_change_points.assert_called_once_with(
        abstimes=ANY, 
        confidence=0.95
    )


@patch("api.services.analysis_services.change_point_analysis.redisClient")
@patch("api.services.analysis_services.change_point_analysis.cache_fallback_service")
@patch("api.services.analysis_services.change_point_analysis.find_change_points")
def test_resolve_current_measurement_cache_miss(mock_find_change_points, mock_cache_fallback, mock_redis):
    mock_request = CpaReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1",
        confidence=99.0
    )

    mock_redis.get.return_value = None

    mock_cached_dict = {
        "channel1": {
            "abstimes": [1e6, 2e6, 3e6]
        }
    }
    mock_cache_fallback.return_value = json.dumps(mock_cached_dict)

    mock_find_change_points.return_value = mock_cpa_res()

    response = resolve_current_measurement(mock_request)

    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767")

    mock_find_change_points.assert_called_once_with(
        abstimes=ANY, 
        confidence=0.99
    )
    
@patch("api.services.analysis_services.lifetime.redisClient")
@patch("api.services.analysis_services.lifetime.cache_fallback_service")
@patch("api.services.analysis_services.lifetime.build_decay_histogram")
@patch("api.services.analysis_services.lifetime.fit_decay")
def test_lifetime_analysis_cache_hit_with_fitting(
    mock_fit_decay, 
    mock_build_histogram, 
    mock_cache_fallback, 
    mock_redis
):

    mock_request = LifetimeReq(upload_id= "123e4567-e89b-12d3-a456-676767676767", measurement_id="1", bin_size=1.0, fitting_model="mono_exponential"
    )

    mock_cached_dict = {
        "channel1": {"microtimes": [10, 20, 30]},
        "channelWidth": 0.05
    }
    mock_redis.get.return_value = json.dumps(mock_cached_dict)

    time_bins = np.array([0.0, 0.1, 0.2])
    histogram = np.array([100, 50, 25])
    fit_curve = np.array([99.9, 50.1, 24.8])
    fit_params = {"tau": 2.5, "amp": 100}
    mock_build_histogram.return_value = (time_bins, histogram)
    mock_fit_decay.return_value = (fit_curve, fit_params)

    response = lifetime_analysis(mock_request)

    assert isinstance(response, LifetimeRes)
    assert response.time_bins == time_bins.tolist()
    assert response.histogram == histogram.tolist()
    assert response.fit_curve == fit_curve.tolist()
    assert response.fit_params == fit_params
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_not_called()
    mock_build_histogram.assert_called_once_with(microtimes=[10, 20, 30], channelwidth=0.05)
    
    mock_fit_decay.assert_called_once_with(t=ANY, counts=ANY, channelwidth=0.05)
    

@patch("api.services.analysis_services.lifetime.redisClient")
@patch("api.services.analysis_services.lifetime.cache_fallback_service")
@patch("api.services.analysis_services.lifetime.build_decay_histogram")
@patch("api.services.analysis_services.lifetime.fit_decay")
def test_lifetime_analysis_cache_miss_no_fitting(mock_fit_decay, mock_build_histogram, mock_cache_fallback, mock_redis):
    mock_request = LifetimeReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1",
        bin_size=1.0,
        fitting_model="" 
    )

    mock_redis.get.return_value = None

    mock_cached_dict = {
        "channel1": {"microtimes": [5, 15, 25]},
        "channelWidth": 0.05
    }
    mock_cache_fallback.return_value = json.dumps(mock_cached_dict)

    time_bins = np.array([0.0, 0.1, 0.2])
    histogram = np.array([100, 50, 25])
    mock_build_histogram.return_value = (time_bins, histogram)

    response = lifetime_analysis(mock_request)
    assert response.fit_curve is None
    assert response.fit_params is None
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767")  
    mock_fit_decay.assert_not_called()
    
    
@patch("api.services.analysis_services.spectra.redisClient")
@patch("api.services.analysis_services.spectra.cache_fallback_service")
def test_spectra_analysis_cache_hit(mock_cache_fallback, mock_redis):
    mock_spectra_request = RasterScanReq(        
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )
    
    mock_cached_spectra_data = {
        "spectra": {
            "data": [
                [59.0, 78.0, 67.5, 71.5],
                [60.0, 79.0, 63.5, 71.5],
                [61.0, 80.0, 65.5, 71.5]
            ],
            "series_times": [4.005799770355225, 6.008699655532837, 8.01159954071045],
            "wavelengths": [833.4079, 833.007401359167, 832.6071450173359],
            "exposure_time": 0.0
        }
    }
    
    mock_redis.get.return_value = json.dumps(mock_cached_spectra_data)
    
    response = get_spectra_data(mock_spectra_request)
    
    expected_z = [
        [59.0, 60.0, 61.0],
        [78.0, 79.0, 80.0],
        [67.5, 63.5, 65.5],
        [71.5, 71.5, 71.5]
    ]
    
    assert isinstance(response, dict)
    assert response["z"] == expected_z
    assert response["rows"] == 4
    assert response["cols"] == 3
    assert response["bounds_min"] == (4.005799770355225, 832.6071450173359)
    assert response["bounds_max"] == (8.01159954071045, 833.4079)
    assert response["scale_min"] == 59.0
    assert response["scale_max"] == 80.0
    assert response["exposure_time"] == 0.0
    mock_redis.get.assert_called_once_with("raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_not_called()
    

@patch("api.services.analysis_services.spectra.redisClient")
@patch("api.services.analysis_services.spectra.cache_fallback_service")
def test_spectra_analysis_cache_miss(mock_cache_fallback, mock_redis):
    mock_spectra_request = RasterScanReq(        
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )
    
    mock_redis.get.return_value = None

    mock_cached_spectra_data = {
        "spectra": {
            "data": [
                [59.0, 78.0, 67.5, 71.5],
                [60.0, 79.0, 63.5, 71.5],
                [61.0, 80.0, 65.5, 71.5]
            ],
            "series_times": [4.005799770355225, 6.008699655532837, 8.01159954071045],
            "wavelengths": [833.4079, 833.007401359167, 832.6071450173359],
            "exposure_time": 0.0
        }
    }
    
    mock_cache_fallback.return_value = json.dumps(mock_cached_spectra_data)
    
    response = get_spectra_data(mock_spectra_request)
    
    expected_z = [
        [59.0, 60.0, 61.0],
        [78.0, 79.0, 80.0],
        [67.5, 63.5, 65.5],
        [71.5, 71.5, 71.5]
    ]
    
    assert isinstance(response, dict)
    assert response["z"] == expected_z
    assert response["rows"] == 4
    assert response["cols"] == 3
    assert response["bounds_min"] == (4.005799770355225, 832.6071450173359)
    assert response["bounds_max"] == (8.01159954071045, 833.4079)
    assert response["scale_min"] == 59.0
    assert response["scale_max"] == 80.0
    assert response["exposure_time"] == 0.0
    mock_redis.get.assert_called_once_with("raw_data:123e4567-e89b-12d3-a456-676767676767:1")
    mock_cache_fallback.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767")

@patch("api.services.analysis_services.cache_fallback.redisClient")
@patch("api.services.analysis_services.cache_fallback.read_hdf5")
@patch("api.services.analysis_services.cache_fallback.download_to_temp")
@patch("api.services.analysis_services.cache_fallback.supabaseClient")
def test_cache_fallback_service_success(
    mock_supabase, 
    mock_download, 
    mock_read_hdf5, 
    mock_redis
):
    upload_id = "123e4567-e89b-12d3-a456-676767676767"
    expected_storage_key = "123e4567-e89b-12d3-a456-676767676767/user47/file.hdf5"
    expected_temp_path = "/tmp/power_study.hdf5"

    mock_execute = MagicMock()
    mock_execute.data = [{"storage_key": expected_storage_key}]
    mock_eq = MagicMock()
    mock_eq.execute.return_value = mock_execute
    mock_select = MagicMock()
    mock_select.eq.return_value = mock_eq
    mock_table = MagicMock()
    mock_table.select.return_value = mock_select
    
    mock_supabase.table.return_value = mock_table
    mock_download.return_value = expected_temp_path
    
    measurement_data = {
        "id": "1", 
        "name": "Ms1",
        "channelWidth": 0.0122,
        "description": "CLH [-5], in HEPES buffer @ pH 8.0",
        "channel1": {
            "abstimes": [1e6, 2e6, 3e6]
        }
    }

    mock_hdf5_data = {
        "metadata": {"name": "power_study.h5", "has_spectra": True, "has_raster": True},
        "measurements": [measurement_data]
    }
    mock_read_hdf5.return_value = mock_hdf5_data

    expected_cached_result = json.dumps(measurement_data)
    mock_redis.get.return_value = expected_cached_result

    result = cache_fallback_service(upload_id)

    assert result == expected_cached_result

    mock_supabase.table.assert_called_once_with("hdf5_uploads")
    mock_table.select.assert_called_once_with("storage_key")
    mock_select.eq.assert_called_once_with("id", upload_id)
    mock_download.assert_called_once_with(expected_storage_key, ".hdf5")
    mock_read_hdf5.assert_called_once_with(expected_temp_path)

    expected_redis_calls = [
        call(f"raw_data:{upload_id}:1", expected_cached_result)
    ]
    mock_redis.set.assert_has_calls(expected_redis_calls, any_order=False)
    mock_redis.get.assert_called_once_with(f"raw_data:{upload_id}:1")
    
@patch("api.services.analysis_services.cache_fallback.redisClient")
@patch("api.services.analysis_services.cache_fallback.read_hdf5")
@patch("api.services.analysis_services.cache_fallback.download_to_temp")
@patch("api.services.analysis_services.cache_fallback.supabaseClient")
def test_cache_fallback_service_upload_not_found(
    mock_supabase, 
    mock_download, 
    mock_read_hdf5, 
    mock_redis
):
    upload_id = "fake-fugazi-does-not-exist"
    mock_execute = MagicMock()
    mock_execute.data = []  #empty
    
    
    mock_eq = MagicMock()
    mock_eq.execute.return_value = mock_execute
    mock_select = MagicMock()
    mock_select.eq.return_value = mock_eq
    mock_table = MagicMock()
    mock_table.select.return_value = mock_select
    mock_supabase.table.return_value = mock_table

    #should raise an IndexError on data[0]
    with pytest.raises(IndexError):
        cache_fallback_service(upload_id)

    mock_download.assert_not_called()
    mock_read_hdf5.assert_not_called()
    mock_redis.set.assert_not_called()
    mock_redis.get.assert_not_called()
    