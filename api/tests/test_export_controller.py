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

    with pytest.raises(HTTPException) as exception:
        handle_export(request, None, "user1")

    assert exception.value.status_code == 400


def test_noMeas_selections_raise400():
    request = make_request(export_intensity=True, selections=[])

    with pytest.raises(HTTPException) as exception:
        handle_export(request, None, "user1")

    assert exception.value.status_code == 400

def test_notImplemented_raises501():
    def fake_export_dataFunc(request, user_id):
        raise NotImplementedError("no session")

    originalFunc= export_controller.export_service.export_data
    export_controller.export_service.export_data = fake_export_dataFunc

    try:
        request = make_request(export_intensity=True)

        with pytest.raises(HTTPException) as exception:
            handle_export(request, None, "user1")

    finally:
        export_controller.export_service.export_data = originalFunc

    assert exception.value.status_code == 501


def test_notImplemented_returns501():
    def fake_export_dataFunc(request, user_id):
        raise NotImplementedError("no session")

    originalFunc= export_controller.export_service.export_data
    export_controller.export_service.export_data = fake_export_dataFunc

    try:
        request = make_request(export_intensity=True)

        with pytest.raises(HTTPException) as exception:
            handle_export(request, None, "user1")

    finally:
        export_controller.export_service.export_data = originalFunc

    assert exception.value.status_code == 501

def test_generic_error_returns500():
    def fake_export_dataFunc(request, user_id):
        raise Exception("unexpected error")

    originalFunc= export_controller.export_service.export_data
    export_controller.export_service.export_data = fake_export_dataFunc

    try:
        request = make_request(export_intensity=True)

        with pytest.raises(HTTPException) as exception:
            handle_export(request, None, "user1")

    finally:
        export_controller.export_service.export_data = originalFunc

    assert exception.value.status_code == 500





