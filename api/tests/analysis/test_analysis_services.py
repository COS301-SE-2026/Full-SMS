import json
import numpy as np
from unittest.mock import MagicMock, call, patch, ANY
from api.routes.analysis_routes import LifetimePayload, get_spectra_data
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.analysis_services.change_point_analysis import resolve_current_measurement
import pytest
from api.models.analysis_models import ClusteringReq, CpaReq, IntensityReq, IntensityRes, LifetimeReq, LifetimeRes, RasterScanReq
from api.services.analysis_services.intensity import intensity_analysis
from api.services.analysis_services.raster_scan import get_raster_scan_data
from dataclasses import dataclass
from api.services.analysis_services.clustering_job_service import clustering_job
from api.legacy.models.level import LevelData
from api.legacy.analysis.lifetime import fit_decay
from api.services.analysis_services.clustering import execute_clustering
from api.services.analysis_services.lifetime import fluorescence_decay, lifetime_fitting

@patch("api.services.analysis_services.intensity.get_cached_measurement")
@patch("api.services.analysis_services.intensity.bin_photons")
@patch("api.services.analysis_services.intensity.compute_intensity_cps")
def test_intensity_analysis_cache_hit(mock_compute_intensity, mock_bin_photons, mock_get_cached):
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
    mock_get_cached.return_value = mock_cached_dict

    times = np.array([0, 1, 2])
    counts = np.array([2, 5, 8]) 
    intensity_cps = np.array([200, 500, 800])
    
    mock_bin_photons.return_value = (times, counts)
    mock_compute_intensity.return_value = intensity_cps
    response = intensity_analysis(mock_request)

    assert isinstance(response, IntensityRes)
    assert response.time_bins == times.tolist()
    assert response.intensity_cps == intensity_cps.tolist() 
    assert response.counts == counts.tolist()
    mock_get_cached.assert_called_once_with(upload_id="123e4567-e89b-12d3-a456-676767676767", measurement_id="1")
    mock_bin_photons.assert_called_once_with(
        abstimes=ANY, 
        bin_size_ms=10.0
    )
    mock_compute_intensity.assert_called_once_with(
        counts=ANY, 
        bin_size_ms=10.0
    )
    

@patch("api.services.analysis_services.intensity.get_cached_measurement")
@patch("api.services.analysis_services.intensity.cache_fallback_service")
@patch("api.services.analysis_services.intensity.bin_photons")
@patch("api.services.analysis_services.intensity.compute_intensity_cps")
def test_intensity_analysis_cache_miss(mock_compute_intensity, mock_bin_photons, mock_cache_fallback, mock_get_cached):
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
    
    mock_get_cached.return_value = None
    
    mock_cache_fallback.return_value = mock_cached_dict
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
    mock_get_cached.assert_called_once_with(upload_id="123e4567-e89b-12d3-a456-676767676767", measurement_id="1")
    mock_cache_fallback.assert_called_once_with(upload_id="123e4567-e89b-12d3-a456-676767676767", measurement_id="1")
    

@patch("api.services.analysis_services.raster_scan.get_cached_measurement")
@patch("api.services.analysis_services.raster_scan.cache_fallback_service")
def test_raster_scan_data_cache_hit(mock_cache_fallback, mock_get_cached):
    mock_request = RasterScanReq(
        upload_id = "123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )

    mock_raster = MagicMock()
    mock_raster.data = np.array([[1, 2], [3, 4]])
    mock_raster.x_start = 10.0
    mock_raster.y_start = 20.0
    mock_raster.scan_range = 50.0
    mock_raster.pixels_per_line = 2
    mock_raster.integration_time = 1.0

    mock_measurement = MagicMock()
    mock_measurement.raster_scan = mock_raster
    mock_measurement.raster_scan_coord = (10, 20)
    mock_get_cached.return_value = mock_measurement

    response = get_raster_scan_data(mock_request)
    assert response["raster_scan"]["data"] == [[1, 2], [3, 4]]
    assert response["raster_scan"]["scan_range"] == 50.0
    assert response["raster_scan_coord"] == [10, 20]
    
    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_not_called()
    

@patch("api.services.analysis_services.raster_scan.get_cached_measurement")
@patch("api.services.analysis_services.raster_scan.cache_fallback_service") 
def test_raster_scan_data_cache_miss(mock_cache_fallback, mock_get_cached):
    mock_request = RasterScanReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )

    mock_get_cached.return_value = None

    mock_raster = MagicMock()
    mock_raster.data = np.array([[5, 6], [7, 8]])
    mock_raster.x_start = 10.0
    mock_raster.y_start = 20.0
    mock_raster.scan_range = 50.0
    mock_raster.pixels_per_line = 2
    mock_raster.integration_time = 1.0

    mock_measurement = MagicMock()
    mock_measurement.raster_scan = mock_raster
    mock_measurement.raster_scan_coord = (50, 60)
    mock_cache_fallback.return_value = mock_measurement

    response = get_raster_scan_data(mock_request)
    assert response["raster_scan"]["data"] == [[5, 6], [7, 8]]
    assert response["raster_scan"]["scan_range"] == 50.0
    assert response["raster_scan_coord"] == [50, 60]
    
    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_called_once_with(upload_id="123e4567-e89b-12d3-a456-676767676767", measurement_id="1")

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

@patch("api.services.analysis_services.change_point_analysis.get_cached_measurement")
@patch("api.services.analysis_services.change_point_analysis.cache_fallback_service")
@patch("api.services.analysis_services.change_point_analysis.find_change_points")
def test_resolve_current_measurement_cache_hit(mock_find_change_points, mock_cache_fallback, mock_get_cached):
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
    mock_get_cached.return_value = mock_cached_dict

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
    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_not_called()
    
    mock_find_change_points.assert_called_once_with(
        abstimes=ANY, 
        confidence=0.95
    )


@patch("api.services.analysis_services.change_point_analysis.get_cached_measurement")
@patch("api.services.analysis_services.change_point_analysis.cache_fallback_service")
@patch("api.services.analysis_services.change_point_analysis.find_change_points")
def test_resolve_current_measurement_cache_miss(mock_find_change_points, mock_cache_fallback, mock_get_cached):
    mock_request = CpaReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1",
        confidence=99.0
    )

    mock_get_cached.return_value = None

    mock_cached_dict = {
        "channel1": {
            "abstimes": [1e6, 2e6, 3e6]
        }
    }
    mock_cache_fallback.return_value = mock_cached_dict

    mock_find_change_points.return_value = mock_cpa_res()

    response = resolve_current_measurement(mock_request)

    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_called_once_with(upload_id="123e4567-e89b-12d3-a456-676767676767", measurement_id="1")

    mock_find_change_points.assert_called_once_with(
        abstimes=ANY, 
        confidence=0.99
    )
    
@patch("api.services.analysis_services.lifetime.get_cached_measurement")
@patch("api.services.analysis_services.lifetime.cache_fallback_service")
@patch("api.services.analysis_services.lifetime.build_decay_histogram")
@patch("api.services.analysis_services.lifetime.fit_decay")
@patch("api.services.analysis_services.lifetime._fetch_irf_counts", return_value=None)
def test_lifetime_analysis_cache_hit_with_fitting(mock_fetch_irf, mock_fit_decay, mock_build_histogram, mock_cache_fallback, mock_get_cached):
    mock_request = LifetimeReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1",
        bin_size=1.0,
        fitting_model="mono_exponential",
        times=[0.0, 0.1, 0.2],
        counts=[100, 50, 25]
    )

    mock_measurement = MagicMock()
    mock_measurement.channelwidth = 0.05
    mock_measurement.channel1.microtimes = [10, 20, 30]
    mock_get_cached.return_value = mock_measurement

    time_bins = np.array([0.0, 0.1, 0.2])
    histogram = np.array([100, 50, 25])
    mock_build_histogram.return_value = (time_bins, histogram)

    mock_fit_result = MagicMock()
    mock_fit_result.tau = np.array([2.5])
    mock_fit_result.tau_std = np.array([0.1])
    mock_fit_result.amplitude = np.array([100.0])
    mock_fit_result.amplitude_std = np.array([1.5])
    mock_fit_result.shift = 0.0
    mock_fit_result.shift_std = 0.0
    mock_fit_result.chi_squared = 1.05
    mock_fit_result.durbin_watson = 1.8
    mock_fit_result.dw_bounds = None
    mock_fit_result.residuals = np.array([0.1, -0.1, 0.0])
    mock_fit_result.fitted_curve = np.array([99.9, 50.1, 24.8])
    mock_fit_result.fit_start_index = 0
    mock_fit_result.fit_end_index = 3
    mock_fit_result.background = 1.0
    mock_fit_result.num_exponentials = 1
    mock_fit_result.average_lifetime = 2.5
    mock_fit_result.fitted_irf_fwhm = None
    mock_fit_result.fitted_irf_fwhm_std = None

    mock_fit_decay.return_value = mock_fit_result

    response = lifetime_fitting(mock_request)

    assert response.times == [0.0, 0.1, 0.2]
    assert response.counts == [100, 50, 25]
    assert response.tau == [2.5]
    assert response.fitted_curve == [99.9, 50.1, 24.8]
    assert response.average_lifetime == 2.5
    
    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_not_called()
    mock_fit_decay.assert_called_once()


@pytest.mark.parametrize("use_irf", [True, False])
def test_lifetime_fitting_uses_selected_channel_irf(use_irf):
    from types import SimpleNamespace

    from api.services.analysis_services import lifetime as lifetime_service

    irf_counts = np.array([0.0, 3.0, 1.0])
    fit_result = SimpleNamespace(
        tau=(2.5,),
        tau_std=(0.1,),
        amplitude=(1.0,),
        amplitude_std=(0.01,),
        shift=0.0,
        shift_std=0.0,
        chi_squared=1.0,
        durbin_watson=1.8,
        dw_bounds=(1.5, 1.7),
        residuals=np.array([0.0, 0.0]),
        fitted_curve=np.array([90.0, 40.0]),
        fit_start_index=0,
        fit_end_index=2,
        background=0.0,
        num_exponentials=1,
        average_lifetime=2.5,
        fitted_irf_fwhm=None,
        fitted_irf_fwhm_std=None,
    )

    request = LifetimeReq(
        upload_id="dataset",
        measurement_id="2",
        channel=2,
        use_irf=use_irf,
        times=[0.0, 0.1, 0.2],
        counts=[100, 50, 25],
        tau_bounds_per_component=[(0.5, 5.0)],
    )

    with (
        patch.object(
            lifetime_service,
            "get_cached_measurement",
            return_value=MagicMock(channelwidth=0.05),
        ),
        patch.object(
            lifetime_service, "_fetch_irf_counts", return_value=irf_counts
        ) as fetch_irf,
        patch.object(lifetime_service, "fit_decay", return_value=fit_result) as fit_decay,
        patch.object(
            lifetime_service,
            "compute_convolved_fit_curve",
            return_value=(np.array([95.0, 45.0, 20.0]), np.array([0.0, 0.0])),
        ),
    ):
        lifetime_service.lifetime_fitting(request)

    if use_irf:
        fetch_irf.assert_called_once_with(
            dataset_ref="dataset", measurement_id="2", channel=2, workspace_id=None
        )
        np.testing.assert_array_equal(fit_decay.call_args.kwargs["irf"], irf_counts)
        assert fit_decay.call_args.kwargs["tau_bounds_per_component"] == [(0.5, 5.0)]
    else:
        fetch_irf.assert_not_called()
        assert fit_decay.call_args.kwargs["irf"] is None
        assert fit_decay.call_args.kwargs["tau_bounds_per_component"] == [(0.5, 5.0)]


@pytest.mark.parametrize("fit_irf_fwhm", [False, True])
def test_lifetime_fitting_uses_simulated_irf_instead_of_mapped_irf(fit_irf_fwhm):
    from types import SimpleNamespace

    from api.legacy.analysis.lifetime import simulate_irf
    from api.services.analysis_services import lifetime as lifetime_service

    fit_result = SimpleNamespace(
        tau=(2.5,),
        tau_std=(0.1,),
        amplitude=(1.0,),
        amplitude_std=(0.01,),
        shift=0.0,
        shift_std=0.0,
        chi_squared=1.0,
        durbin_watson=1.8,
        dw_bounds=(1.5, 1.7),
        residuals=np.array([0.0, 0.0]),
        fitted_curve=np.array([90.0, 40.0]),
        fit_start_index=0,
        fit_end_index=2,
        background=0.0,
        num_exponentials=1,
        average_lifetime=2.5,
        fitted_irf_fwhm=0.3 if fit_irf_fwhm else None,
        fitted_irf_fwhm_std=0.01 if fit_irf_fwhm else None,
    )

    request = LifetimeReq(
        upload_id="dataset",
        measurement_id="2",
        use_irf=True,
        times=[0.0, 0.1, 0.2],
        counts=[10, 100, 25],
        simulated_irf_fwhm=0.2,
        fit_irf_fwhm=fit_irf_fwhm,
        irf_fwhm_init=0.2 if fit_irf_fwhm else None,
    )

    with (
        patch.object(
            lifetime_service,
            "get_cached_measurement",
            return_value=MagicMock(channelwidth=0.1),
        ),
        patch.object(lifetime_service, "_fetch_irf_counts") as fetch_irf,
        patch.object(lifetime_service, "fit_decay", return_value=fit_result) as fit_decay,
        patch.object(
            lifetime_service,
            "compute_convolved_fit_curve",
            return_value=(np.array([95.0, 45.0, 20.0]), np.array([0.0, 0.0])),
        ),
    ):
        lifetime_service.lifetime_fitting(request)

    expected_irf, _ = simulate_irf(0.1, 0.2, np.array([10, 100, 25], dtype=np.float64))
    fetch_irf.assert_not_called()
    np.testing.assert_allclose(fit_decay.call_args.kwargs["irf"], expected_irf)
    assert fit_decay.call_args.kwargs["fit_irf_fwhm"] is fit_irf_fwhm


def test_fluorescence_decay_uses_inclusive_level_photon_indices():
    request = LifetimePayload(
        upload_id="dataset",
        measurement_id="1",
        bin_size_ms=10.0,
        channel=1,
        start_photon_idx=1,
        end_photon_idx=2,
    )
    measurement = {
        "channel1": {"microtimes": [0.0, 0.1, 0.2, 0.3]},
        "channelwidth": 0.1,
    }

    with (
        patch("api.services.analysis_services.lifetime.get_cached_measurement", return_value=measurement),
        patch("api.services.analysis_services.lifetime.build_decay_histogram", return_value=(np.array([0.1]), np.array([2]))) as build_histogram,
        patch("api.services.analysis_services.lifetime._fetch_irf_data", return_value=None),
    ):
        fluorescence_decay(request)

    np.testing.assert_array_equal(
        build_histogram.call_args.kwargs["microtimes"],
        np.array([0.1, 0.2]),
    )


def test_fit_decay_applies_distinct_bounds_to_each_lifetime():
    fitted_parameters = np.array([0.5, 2.0, 0.5, 0.5, 0.0])
    with patch(
        "api.legacy.analysis.lifetime.curve_fit",
        return_value=(fitted_parameters, np.eye(len(fitted_parameters))),
    ) as curve_fit_mock:
        fit_decay(
            t=np.array([0.0, 0.1, 0.2, 0.3, 0.4]),
            counts=np.array([100, 80, 60, 40, 20]),
            channelwidth=0.1,
            num_exponentials=2,
            tau_init=[0.5, 2.0],
            tau_bounds=(0.01, 100.0),
            tau_bounds_per_component=[(0.1, 1.0), (1.5, 3.0)],
            start=0,
            end=5,
            background=0.0,
        )

    lower_bounds, upper_bounds = curve_fit_mock.call_args.kwargs["bounds"]
    np.testing.assert_array_equal(lower_bounds, [0.1, 1.5, 0.0, 0.0, -2000.0])
    np.testing.assert_array_equal(upper_bounds, [1.0, 3.0, 1.0, 1.0, 2000.0])


def test_fit_decay_rejects_lifetime_initial_outside_component_bounds():
    with pytest.raises(ValueError, match="initial lifetime must fall within its bounds"):
        fit_decay(
            t=np.array([0.0, 0.1, 0.2, 0.3, 0.4]),
            counts=np.array([100, 80, 60, 40, 20]),
            channelwidth=0.1,
            num_exponentials=2,
            tau_init=[0.05, 2.0],
            tau_bounds_per_component=[(0.1, 1.0), (1.5, 3.0)],
            start=0,
            end=5,
            background=0.0,
        )


def test_fetch_irf_data_treats_none_mapping_responses_as_unmapped():
    from api.services.analysis_services import lifetime as lifetime_service

    query = MagicMock()
    query.execute.return_value = None
    supabase = MagicMock()
    supabase.table.return_value = query
    query.select.return_value = query
    query.eq.return_value = query
    query.maybe_single.return_value = query
    query.single.return_value = query

    with patch.object(lifetime_service, "supabaseClient", supabase):
        result = lifetime_service._fetch_irf_data("dataset", "measurement", 2)

    assert result is None
    assert query.execute.call_count == 2


def test_fetch_irf_data_treats_none_irf_record_as_unavailable():
    from types import SimpleNamespace

    from api.services.analysis_services import lifetime as lifetime_service

    query = MagicMock()
    query.execute.side_effect = [
        SimpleNamespace(data={"irf_id": "irf-id"}),
        None,
    ]
    supabase = MagicMock()
    supabase.table.return_value = query
    query.select.return_value = query
    query.eq.return_value = query
    query.maybe_single.return_value = query
    query.single.return_value = query

    with patch.object(lifetime_service, "supabaseClient", supabase):
        result = lifetime_service._fetch_irf_data("dataset", "measurement", 2)

    assert result is None


@patch("api.services.analysis_services.lifetime.get_cached_measurement")
@patch("api.services.analysis_services.lifetime.cache_fallback_service")
@patch("api.services.analysis_services.lifetime.build_decay_histogram")
@patch("api.services.analysis_services.lifetime.fit_decay")
@patch("api.services.analysis_services.lifetime._fetch_irf_counts", return_value=None)
def test_lifetime_analysis_cache_miss_no_fitting(mock_fetch_irf, mock_fit_decay, mock_build_histogram, mock_cache_fallback, mock_get_cached):
    mock_request = LifetimeReq(
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1",
        bin_size=1.0,
        fitting_model="",
        times=[0.0, 0.1, 0.2],
        counts=[100, 50, 25]
    )

    mock_get_cached.return_value = None

    mock_measurement = MagicMock()
    mock_measurement.channelwidth = 0.05
    mock_measurement.channel1.microtimes = [5, 15, 25]
    mock_cache_fallback.return_value = mock_measurement

    time_bins = np.array([0.0, 0.1, 0.2])
    histogram = np.array([100, 50, 25])
    mock_build_histogram.return_value = (time_bins, histogram)

    mock_empty_fit = MagicMock()
    mock_empty_fit.tau = np.array([])
    mock_empty_fit.tau_std = np.array([])
    mock_empty_fit.amplitude = np.array([])
    mock_empty_fit.amplitude_std = np.array([])
    mock_empty_fit.shift = 0.0
    mock_empty_fit.shift_std = 0.0
    mock_empty_fit.chi_squared = 0.0
    mock_empty_fit.durbin_watson = 0.0
    mock_empty_fit.dw_bounds = None
    mock_empty_fit.residuals = np.array([])
    mock_empty_fit.fitted_curve = np.array([])
    mock_empty_fit.fit_start_index = 0
    mock_empty_fit.fit_end_index = 0
    mock_empty_fit.background = 0.0
    mock_empty_fit.num_exponentials = 0
    mock_empty_fit.average_lifetime = 0.0
    mock_empty_fit.fitted_irf_fwhm = None
    mock_empty_fit.fitted_irf_fwhm_std = None
    
    mock_fit_decay.return_value = mock_empty_fit

    response = lifetime_fitting(mock_request)

    assert response.fitted_curve == [None, None, None]
    assert response.tau == []
    
    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_called_once_with(upload_id="123e4567-e89b-12d3-a456-676767676767", measurement_id="1")
    
    
@patch("api.services.analysis_services.spectra.get_cached_measurement")
@patch("api.services.analysis_services.spectra.cache_fallback_service")
def test_spectra_analysis_cache_hit(mock_cache_fallback, mock_get_cached):
    mock_spectra_request = RasterScanReq(        
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )
    
    mock_measurement = MagicMock()
    mock_spectra = MagicMock()
    mock_spectra.data = [
        [59.0, 78.0, 67.5, 71.5],
        [60.0, 79.0, 63.5, 71.5],
        [61.0, 80.0, 65.5, 71.5]
    ]
    mock_spectra.series_times = [4.005799770355225, 6.008699655532837, 8.01159954071045]
    mock_spectra.wavelengths = [833.4079, 833.007401359167, 832.6071450173359]
    mock_spectra.exposure_time = 0.0
    mock_measurement.spectra = mock_spectra
    
    mock_get_cached.return_value = mock_measurement
    response = get_spectra_data(mock_spectra_request)
    expected_z_matrix = [
        [59.0, 60.0, 61.0],
        [78.0, 79.0, 80.0],
        [67.5, 63.5, 65.5],
        [71.5, 71.5, 71.5]
    ]
    
    assert isinstance(response, dict)
    assert response["z"] == expected_z_matrix
    assert response["rows"] == 4
    assert response["cols"] == 3
    assert response["scale_min"] == 59.0
    assert response["scale_max"] == 80.0
    assert response["exposure_time"] == 0.0
    assert response["bounds_min"] == (4.005799770355225, 832.6071450173359)
    assert response["bounds_max"] == (8.01159954071045, 833.4079)

    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_not_called()
    

@patch("api.services.analysis_services.spectra.get_cached_measurement")
@patch("api.services.analysis_services.spectra.cache_fallback_service")
def test_spectra_analysis_cache_miss(mock_cache_fallback, mock_get_cached):
    mock_spectra_request = RasterScanReq(        
        upload_id="123e4567-e89b-12d3-a456-676767676767",
        measurement_id="1"
    )
    
    mock_get_cached.return_value = None

    mock_measurement = MagicMock()
    mock_spectra = MagicMock()
    mock_spectra.data = [
        [59.0, 78.0, 67.5, 71.5],
        [60.0, 79.0, 63.5, 71.5],
        [61.0, 80.0, 65.5, 71.5]
    ]
    mock_spectra.series_times = [4.005799770355225, 6.008699655532837, 8.01159954071045]
    mock_spectra.wavelengths = [833.4079, 833.007401359167, 832.6071450173359]
    mock_spectra.exposure_time = 0.0
    mock_measurement.spectra = mock_spectra

    mock_cache_fallback.return_value = mock_measurement
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
    mock_get_cached.assert_called_once_with("123e4567-e89b-12d3-a456-676767676767", "1")
    mock_cache_fallback.assert_called_once_with(upload_id="123e4567-e89b-12d3-a456-676767676767", measurement_id="1")

@patch("api.services.analysis_services.cache_fallback.get_cached_measurement")
@patch("api.services.analysis_services.cache_fallback.read_single_measurement")
@patch("api.services.analysis_services.cache_fallback.download_to_temp")
@patch("api.services.analysis_services.cache_fallback.supabaseClient")
def test_cache_fallback_service_success(
    mock_supabase, 
    mock_download, 
    mock_read_single, 
    mock_get_cached
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
    mock_get_cached.return_value = None
    
    mock_measurement = MagicMock()
    mock_measurement.id = 1
    mock_read_single.return_value = mock_measurement

    result = cache_fallback_service(upload_id, 1)

    assert result == mock_measurement

    mock_supabase.table.assert_called_once_with("hdf5_uploads")
    mock_table.select.assert_called_once_with("storage_key")
    mock_select.eq.assert_called_once_with("id", upload_id)
    mock_download.assert_called_once_with(expected_storage_key, ".hdf5")
    mock_read_single.assert_called_once_with(path=expected_temp_path, measurement_id=1)
    
@patch("api.services.analysis_services.cache_fallback.get_cached_measurement")
@patch("api.services.analysis_services.cache_fallback.supabaseClient")
def test_cache_fallback_service_upload_not_found(
    mock_supabase, 
    mock_get_cached
):
    upload_id = "fake-fugazi-does-not-exist"
    mock_get_cached.return_value = None
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
        cache_fallback_service(upload_id, 1)
    


def test_full_range_residuals_cover_whole_decay():
    from api.services.analysis_services.lifetime import _full_range_residuals

    times = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
    counts = np.array([1.0, 4.0, 100.0, 50.0, 25.0])
    residuals = _full_range_residuals(
        times=times,
        counts=counts,
        fit_curve=np.array([100.0, 50.0]),
        fit_start=2,
        fit_end=4,
        background=1.0,
        average_lifetime=1.0,
    )

    assert len(residuals) == 5
    assert all(r is not None for r in residuals)
    assert residuals[2] == pytest.approx(0.0)
    assert residuals[0] == pytest.approx(0.0)  # pre-window model starts at the background
    expected_tail = 1.0 + (50.0 - 1.0) * np.exp(-1.0)
    assert residuals[4] == pytest.approx((25.0 - expected_tail) / 5.0)


def test_full_range_residuals_without_fit_are_empty():
    from api.services.analysis_services.lifetime import _full_range_residuals

    assert _full_range_residuals(
        np.arange(3.0), np.ones(3), np.array([]), 0, 0, 0.0, 1.0
    ) == [None, None, None]


@pytest.mark.parametrize(
    "request_kwargs, fitted_fwhm, irf_counts, expected_source, expected_fwhm",
    [
        ({"use_irf": True}, None, np.array([0.0, 2.0, 1.0]), "mapped", None),
        ({"use_irf": True, "simulated_irf_fwhm": 0.2}, None, np.array([1.0, 3.0, 1.0]), "simulated", 0.2),
        ({"use_irf": True, "simulated_irf_fwhm": 0.2, "fit_irf_fwhm": True}, 0.35, np.array([1.0, 3.0, 1.0]), "simulated", 0.35),
        ({"use_irf": False}, None, None, None, None),
    ],
)
def test_describe_irf_used(request_kwargs, fitted_fwhm, irf_counts, expected_source, expected_fwhm):
    from types import SimpleNamespace

    from api.legacy.analysis.lifetime import simulate_irf
    from api.services.analysis_services.lifetime import _describe_irf_used

    request = LifetimeReq(
        upload_id="u", measurement_id="1", times=[0.0, 0.1, 0.2], counts=[10, 100, 25], **request_kwargs
    )
    source, fwhm, irf = _describe_irf_used(
        request, SimpleNamespace(fitted_irf_fwhm=fitted_fwhm), 0.1, irf_counts
    )

    assert source == expected_source
    assert fwhm == expected_fwhm
    if fitted_fwhm:
        expected, _ = simulate_irf(0.1, fitted_fwhm, np.array([10, 100, 25], dtype=np.float64))
        np.testing.assert_allclose(irf, expected)
    elif irf_counts is not None:
        np.testing.assert_allclose(irf, irf_counts)
    else:
        assert irf is None


def _mapping_query(*responses):
    query = MagicMock()
    query.execute.side_effect = list(responses)
    supabase = MagicMock()
    supabase.table.return_value = query
    query.select.return_value = query
    query.eq.return_value = query
    query.maybe_single.return_value = query
    query.single.return_value = query
    return supabase, query


def test_fetch_irf_data_cleared_mapping_does_not_fall_back_to_dataset_mapping():
    from types import SimpleNamespace

    from api.services.analysis_services import lifetime as lifetime_service

    supabase, query = _mapping_query(SimpleNamespace(data={"irf_id": None}))

    with patch.object(lifetime_service, "supabaseClient", supabase):
        result = lifetime_service._fetch_irf_data("dataset", "3", 1)

    assert result is None
    assert query.execute.call_count == 1  # no wildcard lookup, no IRF record lookup


def test_fetch_irf_data_falls_back_to_dataset_mapping_and_scopes_to_workspace():
    from types import SimpleNamespace

    from api.services.analysis_services import lifetime as lifetime_service

    supabase, query = _mapping_query(
        SimpleNamespace(data=None),
        SimpleNamespace(data={"irf_id": "irf-id"}),
        SimpleNamespace(data={"storage_key": "irfs/irf.csv"}),
    )

    with (
        patch.object(lifetime_service, "supabaseClient", supabase),
        patch.object(lifetime_service, "download_to_temp", return_value="tmp.csv"),
        patch.object(lifetime_service, "read_irf", return_value={"t": [0.0], "counts": [1.0]}) as read_irf,
    ):
        result = lifetime_service._fetch_irf_data("dataset", "3", 1, workspace_id="ws-1")

    assert result == {"t": [0.0], "counts": [1.0]}
    read_irf.assert_called_once_with("tmp.csv")
    eq_calls = [call.args for call in query.eq.call_args_list]
    assert eq_calls.count(("workspace_id", "ws-1")) == 2
    assert ("measurement_id", -1) in eq_calls


def test_select_photons_concatenates_group_ranges():
    from api.services.analysis_services.lifetime import _select_photons

    microtimes = np.arange(10.0)
    selected = _select_photons(microtimes, photon_ranges=[(0, 1), (6, 8)])

    np.testing.assert_array_equal(selected, [0.0, 1.0, 6.0, 7.0, 8.0])


@pytest.mark.parametrize(
    "kwargs",
    [
        {"photon_ranges": []},
        {"photon_ranges": [(5, 12)]},
        {"photon_ranges": [(3, 1)]},
        {"start_idx": 0, "end_idx": 1, "photon_ranges": [(2, 3)]},
        {"start_idx": 0},
    ],
)
def test_select_photons_rejects_invalid_ranges(kwargs):
    from api.services.analysis_services.lifetime import _select_photons

    with pytest.raises(ValueError):
        _select_photons(np.arange(10.0), **kwargs)
