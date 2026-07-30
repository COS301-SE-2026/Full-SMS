import pytest
from pathlib import Path
from fastapi import HTTPException
from api.controllers.export_controller import handle_export
from api.models.export_request import ExportRequest
import api.controllers.export_controller as export_controller

def make_request(
    upload_id="u1",
    selections =None, 
    export_intensity = False,
    export_levels = False,
    export_groups = False,
    plot_intensity = False,
    plot_bic=False,
    format="csv",
    plot_format="png",
    plot_dpi=150,
    bin_size_ms=10,

):
    if selections is None:
        selections = [{"measurement_id": "1", "channel": 1}]

    return ExportRequest(
    upload_id=upload_id,
    selections =selections, 
    export_intensity = export_intensity,
    export_levels = export_levels,
    export_groups = export_groups,
    plot_intensity = plot_intensity,
    plot_bic=plot_bic,
    format=format,
    plot_format= plot_format,
    plot_dpi=plot_dpi,
    bin_size_ms=bin_size_ms,

)    

def test_noCategory_selected_raise400():
    request = make_request()

    with pytest.raises(HTTPException) as exc:
        handle_export(request, None, "user1")

    assert exc.value.status_code == 400


def test_noMeas_selections_raise400():
    request = make_request(export_intensity=True, selections=[])

    with pytest.raises(HTTPException) as exc:
        handle_export(request, None, "user1")

    assert exc.value.status_code == 400


