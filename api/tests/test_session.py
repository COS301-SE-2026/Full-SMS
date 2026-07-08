import os
from dotenv import load_dotenv
load_dotenv()
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
from main import app

client = TestClient(app)

MOCK_TOKEN = "mock.jwt.token"
MOCK_USER_ID = "testUser1"
MOCK_SESSION = {
    'id': 'mock-session-uuid-123',
    'user_id': MOCK_USER_ID,
    'name': 'Test Session 0',
    'dataset_ref': 'experiment.pt3',
    'parameters': {'bin_size': 10, 'confidence': 0.95},
    'results': {'change_points': [100, 250, 400]},
    'created_at': '2026-07-03T10:00:00'
}
MOCK_SESSION_LIST = [
    MOCK_SESSION,
    {
        'id': 'mock-session-uuid-456',
        'user_id': MOCK_USER_ID,
        'name': 'Test Session 1',
        'dataset_ref': 'data.csv',
        'parameters': {'bin_size': 5, 'confidence': 0.90},
        'results': {'change_points': [50, 150, 300]},
        'created_at': '2026-07-03T11:00:00'
    }
]

class TestSaveSession:
    def test_save_session_success(self):
        with patch("routes.session_routes.handle_save_session",return_value=MOCK_SESSION):
            response = client.post("/api/py/sessions",
                                   json={
                                       "name":'Test Session 0',
                                       'dataset_ref':'experiment.h5',
                                       'parameters': {'bin_size':10, 'confidence':0.96},
                                       'results': {}
                                   }, params={"user_id":MOCK_USER_ID})
            assert response.status_code == 200
            assert response.json()["name"] == "Test Session 0"
            assert response.json()["user_id"] == MOCK_USER_ID
