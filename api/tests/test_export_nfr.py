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
        pass