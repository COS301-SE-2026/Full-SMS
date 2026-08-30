import time
import json
import pytest
from pathlib import Path

from api.models.export_request import ExportRequest, Selection
import api.services.export_service as export_service


class TestExportPerformanceNFR:
    def test_intensityExport_withinTarget(self):
        pass