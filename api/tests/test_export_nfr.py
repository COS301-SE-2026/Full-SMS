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
        request = make_request()

        fake_meas = {
            "name": "raw",
            "channel1": {"abstimes": list(range(0, 1_000_000, 10))},
        }

        def fake_redisGet(key):
            return json.dumps(fake_meas)

        original_redis = export_service.redisClient.get
        export_service.redisClient.get = fake_redisGet
        

        