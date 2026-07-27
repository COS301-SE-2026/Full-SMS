import json
import numpy as np
from unittest.mock import MagicMock, patch, ANY
from api.services.analysis_services.change_point_analysis import resolve_current_measurement
import pytest
from api.models.analysis_models import ClusteringReq, CpaReq, IntensityReq, IntensityRes, RasterScanReq
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.raster_scan import get_raster_scan_data
from dataclasses import dataclass
from api.services.analysis_services.clustering_job_service import clustering_job
from api.legacy.models.level import LevelData
from api.services.analysis_services.clustering import execute_clustering

@patch("api.services.analysis_services.intensity.redisClient")
@patch("api.services.analysis_services.intensity.bin_photons")
@patch("api.services.analysis_services.intensity.compute_intensity_cps")
def test_intensity_analysis_cache_hit(mock_compute_intensity, mock_bin_photons, mock_redis):
    mock_request = IntensityReq(
        upload_id="123e4567-e89b-12d3-a456-426614174000", 
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
    
    mock_redis.get.assert_called_once_with("raw_data:123e4567-e89b-12d3-a456-426614174000:1")
    
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
        upload_id="123e4567-e89b-12d3-a456-426614174000",
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
    
    mock_redis.get.assert_called_once_with("raw_data:123e4567-e89b-12d3-a456-426614174000:1")
    mock_cache_fallback.assert_called_once_with("123e4567-e89b-12d3-a456-426614174000")
    

@patch("api.services.analysis_services.raster_scan.redisClient")
@patch("api.services.analysis_services.raster_scan.cache_fallback")
def test_raster_scan_data_cache_hit(mock_cache_fallback, mock_redis):
    mock_request = RasterScanReq(
        upload_id = "123e4567-e89b-12d3-a456-426614174000",
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
    
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-426614174000:1")
    mock_cache_fallback.assert_not_called() #verify fallback was skipped
    

@patch("api.services.analysis_services.raster_scan.redisClient")
@patch("api.services.analysis_services.raster_scan.cache_fallback") 
def test_raster_scan_data_cache_miss(mock_cache_fallback, mock_redis):
    mock_request = RasterScanReq(
        upload_id="123e4567-e89b-12d3-a456-426614174000",
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
    
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-426614174000:1")
    mock_cache_fallback.assert_called_once_with("123e4567-e89b-12d3-a456-426614174000")

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
        upload_id="123e4567-e89b-12d3-a456-426614174000",
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
    mock_redis.get.assert_called_once_with(f"raw_data:123e4567-e89b-12d3-a456-426614174000:1")
    mock_cache_fallback.assert_not_called()
    
    mock_find_change_points.assert_called_once_with(
        abstimes=ANY, 
        confidence=0.95
    )


@patch("api.services.analysis_services.change_point_analysis.redisClient")
@patch("api.services.analysis_services.change_point_analysis.cache_fallback_service")
@patch("api.services.analysis_services.change_point_analysis.find_change_points")
def test_resolve_current_measurement_cache_miss(mock_find_change_points, mock_cache_fallback, mock_redis):
    upload_uuid = "123e4567-e89b-12d3-a456-426614174000"
    mock_request = CpaReq(
        upload_id=upload_uuid,
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

    mock_redis.get.assert_called_once_with(f"raw_data:{upload_uuid}:1")
    mock_cache_fallback.assert_called_once_with(upload_uuid)

    mock_find_change_points.assert_called_once_with(
        abstimes=ANY, 
        confidence=0.99
    )