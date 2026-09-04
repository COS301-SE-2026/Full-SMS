import time
import pickle
import numpy as np
import pytest
from pathlib import Path
from unittest.mock import MagicMock

from api.models.export_request import ExportRequest, Selection
import api.services.export_service as export_service


def make_request(**overrides):
    defaults = dict(
        upload_id="upload123",
        selections =[Selection(measurement_id="m1", channel=1)], 
        export_levels = False,
        export_groups = False,
        export_intensity = True,
        bin_size_ms=10,
    )
    defaults.update(overrides)
    return ExportRequest(**defaults)


class TestExportPerformanceNFR:
    def test_intensityExport_withinTarget(self):
        TARGET_SECONDS = 0.5
        request = make_request()

        fake_meas = {
            "id": "m1",
            "name": "raw",
            "channelWidth": 0.0122,
            "description": "test",
            "channel1": {
                "abstimes": np.arange(0, 1_000_000, 10, dtype=np.uint64),
                "microtimes": np.array([], dtype=np.uint32),
            },
            "channel2": None,
        }

        original_get = export_service.get_cached_measurement
        export_service.get_cached_measurement = lambda u, m: fake_meas

        try:
            start = time.perf_counter()

            result_path, result_name = export_service.export_data(
                request, 
                "user1"
            )

            elapsed = time.perf_counter() - start
        finally:
            export_service.get_cached_measurement = original_get

        assert result_path.exists()
        print(f"\nExport took {elapsed:.4f}s (target:  {TARGET_SECONDS}s)")
        assert elapsed < TARGET_SECONDS


    def test_intensityExport_largeDataset(self):
        TARGET_SECONDS = 3.0
        request = make_request()

        fake_meas = {
            "id": "m1",
            "name": "raw",
            "channelWidth": 0.0122,
            "description": "test",
            "channel1": {
                "abstimes": np.arange(0, 50_000_000, 10, dtype=np.uint64),
                "microtimes": np.array([], dtype=np.uint32),
            },
            "channel2": None,
        }

        original_get = export_service.get_cached_measurement
        export_service.get_cached_measurement = lambda u, m: fake_meas

        try:
            start = time.perf_counter()

            result_path, result_name = export_service.export_data(
                request, 
                "user1"
            )

            elapsed = time.perf_counter() - start
        finally:
            export_service.get_cached_measurement = original_get

        assert result_path.exists()
        print(f"\nExport took {elapsed:.4f}s (target:  {TARGET_SECONDS}s)")
        assert elapsed < TARGET_SECONDS




        

        