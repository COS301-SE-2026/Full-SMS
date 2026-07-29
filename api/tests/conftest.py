import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from api.main import app
import uuid


@pytest.fixture
def api_client():
    """Provides a test client for the FastAPI routes."""
    return TestClient(app)


@pytest.fixture
def mock_redis():
    """
    Provides a fake Redis client.
    It intercepts connection attempt to the real Redis database.
    """
    with patch("redis.Redis") as mock_redis_class:
        # dummy instance of the Redis client
        mock_instance = MagicMock()
        mock_redis_class.return_value = mock_instance

        # Yield hands the fake instance to tests
        yield mock_instance


@pytest.fixture
def sample_user_id():
    return str(uuid.uuid4())


@pytest.fixture
def sample_workspace_id():
    return str(uuid.uuid4())


@pytest.fixture
def sample_plugin_id():
    return str(uuid.uuid4())
