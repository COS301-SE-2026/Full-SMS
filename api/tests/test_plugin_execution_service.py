from unittest.mock import patch
import httpx


class TestValidateScript:
    def test_validate_script_valid(self):
        from api.services.plugin_execution_service import validate_script

        script = "import numpy as np\nresult = np.mean([1, 2, 3])"
        result = validate_script(script)

        assert result["success"] is True

    def test_validate_script_blocks_os(self):
        from api.services.plugin_execution_service import validate_script

        result = validate_script("import os")
        assert result["success"] is False
        assert "OS module" in result["error"]

    def test_validate_script_blocks_subprocess(self):
        from api.services.plugin_execution_service import validate_script

        result = validate_script("import subprocess")
        assert result["success"] is False

    def test_validate_script_blocks_eval(self):
        from api.services.plugin_execution_service import validate_script

        result = validate_script("eval('1+1')")
        assert result["success"] is False

    def test_validate_script_blocks_open(self):
        from api.services.plugin_execution_service import validate_script

        result = validate_script("open('/etc/passwd')")
        assert result["success"] is False

    def test_validate_script_syntax_error(self):
        from api.services.plugin_execution_service import validate_script

        result = validate_script("def foo(\n    print('incomplete'")
        assert result["success"] is False
        assert "Syntax error" in result["error"]


class TestExecutePlugin:

    def test_execute_plugin_missing_api_key(self):
        with patch("api.services.plugin_execution_service.EXECUTION_API_KEY", None):
            from api.services.plugin_execution_service import execute_plugin

            result = execute_plugin("result = 1", {}, {})
            assert result["success"] is False
            assert "API key" in result["error"]

    def test_execute_plugin_validation_failure(self):
        with patch("api.services.plugin_execution_service.EXECUTION_API_KEY", "key"):
            from api.services.plugin_execution_service import execute_plugin

            result = execute_plugin("import os", {}, {})
            assert result["success"] is False
            assert "validation failed" in result["error"]

    def test_execute_plugin_timeout(self):
        with patch(
            "api.services.plugin_execution_service.EXECUTION_API_KEY", "key"
        ), patch(
            "api.services.plugin_execution_service.EXECUTION_URL", "http://test"
        ), patch(
            "httpx.Client"
        ) as mock_client:
            mock_client.return_value.__enter__.return_value.post.side_effect = (
                httpx.TimeoutException("timeout")
            )

            from api.services.plugin_execution_service import execute_plugin

            result = execute_plugin("result = 1", {}, {})
            assert result["success"] is False
            assert "timed out" in result["error"]
