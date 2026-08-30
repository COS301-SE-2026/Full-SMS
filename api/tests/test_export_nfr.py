import time
import json
import pytest
from pathlib import Path

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
            "name": "raw",
            "channel1": {"abstimes": list(range(0, 1_000_000, 10))},
        }

        def fake_redisGet(key):
            return json.dumps(fake_meas)

        original_redis = export_service.redisClient.get
        export_service.redisClient.get = fake_redisGet

        try:
            start = time.perf_counter()

            result_path, result_name =export_service.export_data(
                request, 
                "user1"
            )

            elapsed = time.perf_counter() - start
        finally:
            export_service.redisClient.get = original_redis

        assert result_path.exists()
        print(f"\nExport took {elapsed:.4f}s (target:  {TARGET_SECONDS}s)")
        assert elapsed < TARGET_SECONDS


    def test_intensityExport_largeDataset(self):
        TARGET_SECONDS = 3.0
        request = make_request()

        fake_meas = {
            "name": "raw",
            "channel1": {"abstimes": list(range(0, 50_000_000, 10))},
        }

        def fake_redisGet(key):
            return json.dumps(fake_meas)

        original_redis = export_service.redisClient.get
        export_service.redisClient.get = fake_redisGet

        try:
            start = time.perf_counter()

            result_path, result_name =export_service.export_data(
                request, 
                "user1"
            )

            elapsed = time.perf_counter() - start
        finally:
            export_service.redisClient.get = original_redis

        assert result_path.exists()
        print(f"\nExport took {elapsed:.4f}s (target:  {TARGET_SECONDS}s)")
        assert elapsed < TARGET_SECONDS




        

        