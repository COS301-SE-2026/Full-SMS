import pytest
import json
from fastapi.testclient import TestClient
from api.main import app
from api.routes.profile_routes import get_current_user 
import api.services.export_service as export_service


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


class TestExportRouteE2E:
    def test_full_Export(self):
        fake_meas = {
            "name": "raw",
            "channel1": {"abstimes": [1000, 2000, 3000, 15000, 16000]},
        }

        def fakeRedis(key):
            return json.dumps(fake_meas)

        originalRedis = export_service.redisClient.get
        export_service.redisClient.get = fakeRedis

        try:
            response = client.post(
                EXPORT_URL,
                json={
                    "upload_id": "upload123",
                    "selections": [{"measurement_id": "m1", "channel": 1}], 
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
        finally:
            export_service.redisClient.get = originalRedis

        assert response.status_code == 200
        assert len(response.content) > 0


    def test_fullGroups_Export(self):
            fake_meas = {
                "name": "raw",
                "channel1": {"abstimes": [1000, 2000, 3000]},
            }

            fake_session=[
                    {"dataset_ref": "upload123", "created_at": "2026-01-01", 
                        "results": {"levels": None,
                        "groups":{
                            "selected_step_index":0,
                            "steps":[
                                {
                                    "groups": [{"group_id": 1, "total_photons":10, "total_dwell_time_s": 1.0, "intensity_cps": 100.0, "level_indices":[0],}]
                                }
                            ],
                        },
                    },
                }
            ]
            def fake_redisGet(key):
                return json.dumps(fake_meas)
            
            def fake_getSession(user_id):
                return fake_session
    
            originalRedis=export_service.redisClient.get
            original_getSessions = export_service.get_sessions
    
            export_service.redisClient.get = fake_redisGet
            export_service.get_sessions = fake_getSession

            try:
                response = client.post(
                    EXPORT_URL,
                    json={
                        "upload_id": "upload123",
                        "selections": [{"measurement_id": "m1", "channel": 1}], 
                        "export_intensity": False,
                        "export_levels": False,
                        "export_groups": True,
                        "plot_intensity": False,
                        "plot_bic": False,
                        "format": "csv",
                        "plot_format": "png",
                        "plot_dpi": 150,
                        "bin_size_ms": 10,
                    },
                )
            finally:
                export_service.redisClient.get = originalRedis
                export_service.get_sessions = original_getSessions
    
            assert response.status_code == 200
            assert len(response.content) > 0