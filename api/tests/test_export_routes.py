import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.routes.profile_routes import get_current_user 


client = TestClient(app)

@pytest.fixture(autouse=True)
def override_auth():
    def fake_current_user():
        return {"user":{"id": "user1"}}

    app.dependency_overrides[get_current_user] = fake_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


EXPORT_URL = "/api/py/export"

def test_routeReject_unselected_category():
    response = client.post(
        EXPORT_URL,
        json={
            "upload_id": "u1",
            "selections": [{"measurement_id": "1", "channel": 1,}], 
            "export_intensity": False,
            "export_levels": False,
            "export_groups": False,
            "plot_intensity": False,
            "plot_bic": False,
            "format": "csv",
            "plot_format": "png",
            "plot_dpi": 150,
            "bin_size_ms": 10,
        },
    )
    assert response.status_code == 400


def test_routeReject_noMeasurement_selected():
    response = client.post(
        EXPORT_URL,
        json={
            "upload_id": "u1",
            "selections": [], 
            "export_intensity": True,
            "export_levels": False,
            "export_groups": False,
            "plot_intensity": False,
            "plot_bic": False,
            "format": "csv",
            "plot_format": "png",
            "plot_dpi": 150,
            "bin_size_ms": 10,
        },
    )
    assert response.status_code == 400
