from api.main import app
from unittest.mock import patch
from fastapi.testclient import TestClient

client = TestClient(app)

@patch("api.controllers.analysis_controller.intensity_analysis")
def test_intensity_analysis_ok(mock_intensity):
    intensity_response = {
        "time_bins": [2.1, 3.2, 4.3, 4.4],
        "counts": [20, 100, 180, 260],
        "intensity_cps": [1023, 1384, 1368, 1647]
    }
    mock_intensity.return_value = intensity_response
    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
        "bin_size_ms": 0.7
    }

    response= client.post('api/py/analysis/intensity', json=test_payload)

    assert response.status_code == 200

    assert response.json() == intensity_response
    mock_intensity.assert_called_once()

@patch("api.controllers.analysis_controller.intensity_analysis")
def test_intensity_analysis_server_error(mock_intensity):
    mock_intensity.side_effect = Exception("HDF5 file could not be read")

    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
        "bin_size_ms": 0.7
    }

    response = client.post('api/py/analysis/intensity', json=test_payload)

    assert response.status_code == 500
    assert "HDF5 file could not be read" in response.json()["detail"]

@patch("api.controllers.analysis_controller.intensity_analysis")
def test_intensity_analysis_missing_bin_size(mock_intensity):

    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
        # "bin_size_ms": 0.7 missing bin size
    }

    response = client.post('api/py/analysis/intensity', json=test_payload)
    assert response.status_code == 422

@patch("api.controllers.analysis_controller.resolve_current_meaurement")
def change_point_analysis_ok(mock_change_point):
    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
        "confidence": 99
    }

    cpa_response = {
        "measurement_id": test_payload["measurement_id"],
        "num_change_points": 20,
        "change_point_indices":[1,2,3,5,6,7,8,8],
        "confidence_regions": [
            [1,2],[3,4]
        ],
        "levels": [
            {
                "start_index": 0,
                "end_index": 10,
                "start_time_ns": 590873,
                "end_time_ns": 1014576,
                "num_photons": 67000,
                "intensity_cps": 126.1,
                "group_id": 1
            }
        ]
    }

    response = client.post('api/py/analysis/change-point-analysis', json=test_payload)
    assert response.status_code == 200
    assert response.json() == cpa_response
    mock_change_point.assert_called_once()


@patch("api.controllers.analysis_controller.resolve_current_meaurement")
def change_point_analysis_ok(mock_change_point):
    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
        "confidence": 99
    }

    cpa_response = {
        "measurement_id": test_payload["measurement_id"],
        "num_change_points": 20,
        "change_point_indices":[1,2,3,5,6,7,8,8],
        "confidence_regions": [
            [1,2],[3,4]
        ],
        "levels": [
            {
                "start_index": 0,
                "end_index": 10,
                "start_time_ns": 590873,
                "end_time_ns": 1014576,
                "num_photons": 67000,
                "intensity_cps": 126.1,
                "group_id": 1
            }
        ]
    }

    mock_change_point.return_value = cpa_response

    response = client.post('api/py/analysis/change-point-analysis', json=test_payload)
    assert response.status_code == 200
    assert response.json() == cpa_response
    mock_change_point.assert_called_once()

@patch("api.controllers.analysis_controller.resolve_current_measurement")
def test_change_point_analysis_server_error(mock_change_point):
    mock_change_point.side_effect = Exception("HDF5 file could not be read")

    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
        "confidence": 99
    }

    response = client.post('api/py/analysis/change-point-analysis', json=test_payload)

    assert response.status_code == 500
    assert "Could not complete Change Point Analysis:" in response.json()["detail"]


@patch("api.controllers.analysis_controller.resolve_current_measurement")
def test_change_point_analysis_bad_payload(mock_change_point):
    mock_change_point.side_effect = Exception("HDF5 file could not be read")

    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
        # "confidence": 0.7
    }

    response = client.post('api/py/analysis/change-point-analysis', json=test_payload)

    assert response.status_code == 422

@patch("api.controllers.analysis_controller.get_raster_scan_data")
def test_gest_raster_scan_ok(mock_raster_scan):

    test_payload = {
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
    }

    raster_response = {
        "raster_scan": {
            "data": [
                [81.7, 5.8, 171.5],
                [186.1, 34.7, 153.1],
                [80.9, 161.2, 173.4]
            ],
            "x_start": 20,
            "y_start": 25,
            "scan_range": 5,
            "pixels_per_line": 3, 
            "integration_time": 50
        },
        "raster_scan_coord": [
            20.503,
            27.321
        ]
    }

    mock_raster_scan.return_value = raster_response
    response = client.post('api/py/analysis/raster-scan', json=test_payload)
    assert response.status_code == 200
    assert response.json() == raster_response
    mock_raster_scan.assert_called_once()


@patch("api.controllers.analysis_controller.get_raster_scan_data")
def test_gest_raster_scan_server_error(mock_raster_scan):
    mock_raster_scan.side_effect = Exception("HDF5 file could not be read")

    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
    }

    response = client.post('api/py/analysis/raster-scan', json=test_payload)

    assert response.status_code == 500

@patch("api.controllers.analysis_controller.get_raster_scan_data")
def test_gest_raster_scan_bad_payload(mock_raster_scan):

    test_payload ={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        # "measurement_id":"29",
    }

    response = client.post('api/py/analysis/raster-scan', json=test_payload)

    assert response.status_code == 422


@patch("api.controllers.analysis_controller.clustering_job.delay")
def test_init_clustering_ok(mock_celery_delay):
    
    class mockJob:
        id = "clust-ering-job-1"
        
    mock_celery_delay.return_value = mockJob()

    test_payload = {
        "levels": [
            {"start_index": 2,
             "end_index": 20, 
             "start_time_ns": 14336,
             "end_time_ns": 14336,
             "num_photons": 1500, 
             "intensity_cps": 0.05},

            {"start_index": 2,
             "end_index": 20, 
             "start_time_ns": 14336,
             "end_time_ns": 14336,
             "num_photons": 1500, 
             "intensity_cps": 0.05}
        ]
    }

    response = client.post("/api/py/analysis/grouping", json=test_payload)

    assert response.status_code == 200
    assert response.json() == {
        "task_id": "clust-ering-job-1", 
        "status": "executing"
    }
    mock_celery_delay.assert_called_once()

@patch("api.controllers.analysis_controller.clustering_job.delay")
def test_init_clustering_bad_request(mock_celery_delay):
    mock_celery_delay.side_effect = ValueError("At least 2 levels are needed to execute clustering")
    
    test_payload = {
        "levels": [
            {"start_index": 2,
             "end_index": 20, 
             "start_time_ns": 14336,
             "end_time_ns": 14336,
             "num_photons": 1500, 
             "intensity_cps": 0.05}
        ]
    }
    response = client.post('/api/py/analysis/grouping', json=test_payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "At least 2 levels are needed to execute clustering"


@patch("api.controllers.analysis_controller.clustering_job.delay")
def test_init_clustering_server_error(mock_celery_delay):

    mock_celery_delay.side_effect = Exception("Redis connection refused")
    
    test_payload = {
        "levels": [
            {
                "start_index": 0, 
                "end_index": 10, 
                "start_time_ns": 0,
                "end_time_ns": 100, 
                "num_photons": 10, 
                "intensity_cps": 1.0, 
                "group_id": 1
            }
        ]
    }

    response = client.post('/api/py/analysis/grouping', json=test_payload)

    assert response.status_code == 500
    assert "Could not queue job: Redis connection refused" in response.json()["detail"]

@patch("api.controllers.analysis_controller.AsyncResult")
def test_get_clustering_status_processing(mock_async_result):
    mock_job = mock_async_result.return_value 
    mock_job.ready.return_value = False        
    
    response = client.get('/api/py/analysis/grouping/grou-ping-job-6767')

    assert response.status_code == 200
    assert response.json() == {"status": "processing"}
    mock_async_result.assert_called_once_with("grou-ping-job-6767")


@patch("api.controllers.analysis_controller.AsyncResult")
def test_get_clustering_status_completed(mock_async_result):
    mock_job = mock_async_result.return_value
    mock_job.ready.return_value = True         # dummy job finished
    mock_job.successful.return_value = True    # dummy job succeeded
    
    # The actual output data from the AHCA algorithm
    result = {"clusters": ["group1", "group2"]} 
    mock_job.result = result
    
    response = client.get('/api/py/analysis/grouping/grou-ping-job-6767')

    assert response.status_code == 200
    assert response.json() == {
        "status": "completed", 
        "result": result
    }


@patch("api.controllers.analysis_controller.AsyncResult")
def test_get_clustering_status_failed(mock_async_result):
    mock_job = mock_async_result.return_value
    mock_job.ready.return_value = True         
    mock_job.successful.return_value = False   
    
    mock_job.result = Exception("Math error in AHCA algorithm")
    
    response = client.get('/api/py/analysis/grouping/grou-ping-job-6767')

    assert response.status_code == 200
    assert response.json() == {
        "status": "failed", 
        "error": "Math error in AHCA algorithm"
    }

@patch("api.controllers.analysis_controller.AsyncResult")
def test_get_clustering_status_server_error(mock_async_result):
    mock_async_result.side_effect = Exception("Redis connection timeout")
    
    response = client.get('/api/py/analysis/grouping/grou-ping-job-6767')

    assert response.status_code == 500
    assert "Redis connection timeout" in response.json()["detail"]

@patch("api.controllers.analysis_controller.get_spectra_data")
def test_get_spectra_data(mock_spectra):

    test_payload={
        "upload_id":"aba01010-6767-8989-abab-acacacacaca",
        "measurement_id":"29",
    }


    spectra_response = {
        "z": [0,1,3,4,5],
        "rows": 5 ,
        "cols": 2,
        "bounds_min" :[5, 10],
        "bounds_max" :[10, 20],
        "scale_min" : 40,
        "scale_max" :21,
        "exposure_time" : 0.13
    }

    mock_spectra.return_value = spectra_response
    
    response= client.post('api/py/analysis/spectra', json=test_payload)

    assert response.status_code == 200
    assert response.json() == spectra_response
    mock_spectra.assert_called_once()


@patch("api.controllers.analysis_controller.get_spectra_data")
def test_get_spectra_data_server_error(mock_spectra):
    mock_spectra.side_effect = Exception("Failed to read spectral data")
    test_payload = {
        "upload_id": "aba01010-6767-8989-abab-acacacacaca",
        "measurement_id": "29",
    }

    response = client.post('/api/py/analysis/spectra', json=test_payload)

    assert response.status_code == 500
    assert "Failed to read spectral data" in response.json()["detail"]


@patch("api.controllers.analysis_controller.get_spectra_data")
def test_get_spectra_data_bad_payload(mock_spectra):    
    test_payload = {
        "upload_id": "aba01010-6767-8989-abab-acacacacaca",
        # "measurement_id": "29",
    }

    # 2. ACT
    response = client.post('/api/py/analysis/spectra', json=test_payload)

    assert response.status_code == 422
