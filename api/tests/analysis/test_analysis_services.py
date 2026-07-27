import json
import numpy as np
from unittest.mock import patch, ANY
from api.models.analysis_models import IntensityReq, IntensityRes, RasterScanReq
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.raster_scan import get_raster_scan_data

# FIXED:  Patch exactly where these are imported/used in your code
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

    # Act
    response = intensity_analysis(mock_request)

    # Assert
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
    
