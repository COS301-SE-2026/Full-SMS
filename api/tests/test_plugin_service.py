import pytest
from unittest.mock import MagicMock, patch
import uuid


class TestCreatePlugin:

    def test_create_plugin_success(self, sample_user_id, sample_plugin_config):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Test Plugin",
                    "enabled": True,
                }
            ]
            mock_client.table.return_value.insert.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import create_plugin

            result = create_plugin(
                user_id=sample_user_id,
                name="Test Plugin",
                config=sample_plugin_config,
                script="result = 42",
            )

            assert result["name"] == "Test Plugin"
            assert result["enabled"] is True

    def test_create_plugin_missing_name(self, sample_user_id, sample_plugin_config):
        from api.services.plugin_service import create_plugin

        with pytest.raises(ValueError):
            create_plugin(
                user_id=sample_user_id,
                name="",
                config=sample_plugin_config,
                script="result = 42",
            )

    def test_create_plugin_missing_outputs(self, sample_user_id):
        from api.services.plugin_service import create_plugin

        with pytest.raises(ValueError, match="at least one output"):
            create_plugin(
                user_id=sample_user_id,
                name="Test",
                config={"parameters": [], "outputs": []},
                script="result = 42",
            )


class TestDeletePlugin:
    def test_delete_plugin_not_found(self, sample_plugin_id, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = None
            mock_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import delete_plugin

            with pytest.raises(ValueError, match="Plugin not found"):
                delete_plugin(sample_plugin_id, sample_user_id)


class TestUpdatePlugin:
    def test_updates_plugin_name(self, sample_plugin_id, sample_user_id):
        with patch(
            "api.services.plugin_service.get_supabase_admin"
        ) as mock_admin, patch(
            "api.services.plugin_service.get_plugin_by_id"
        ) as mock_get:
            mock_get.return_value = {"id": sample_plugin_id, "name": "Updated"}

            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{"id": sample_plugin_id}]
            mock_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import update_plugin

            result = update_plugin(sample_plugin_id, sample_user_id, name="Updated")

            assert result["name"] == "Updated"


class TestGetUserPlugins:
    def test_returns_list_of_plugins(self, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{"id": "p1", "name": "Plugin 1"}]
            mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import get_user_plugins

            result = get_user_plugins(sample_user_id)

            assert len(result) == 1
            assert result[0]["name"] == "Plugin 1"


class TestGetPluginById:
    def test_returns_plugin_when_found(self, sample_plugin_id, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = {"id": sample_plugin_id, "name": "Test Plugin"}
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import get_plugin_by_id

            result = get_plugin_by_id(sample_plugin_id, sample_user_id)

            assert result["id"] == sample_plugin_id


class TestIsValidChainableOutput:
    def test_returns_true_for_chainable_data_output(self):
        from api.services.plugin_service import _is_valid_chainable_output

        output = {"type": "array", "chainable": True}
        assert _is_valid_chainable_output(output, None) is True

    def test_returns_false_for_presentation_output(self):
        from api.services.plugin_service import _is_valid_chainable_output

        output = {"type": "plot"}
        assert _is_valid_chainable_output(output, None) is False

    def test_returns_false_when_chainable_is_false(self):
        from api.services.plugin_service import _is_valid_chainable_output

        output = {"type": "array", "chainable": False}
        assert _is_valid_chainable_output(output, None) is False

    def test_respects_accepted_types_filter(self):
        from api.services.plugin_service import _is_valid_chainable_output

        output = {"type": "array"}
        assert _is_valid_chainable_output(output, ["timeseries"]) is False
        assert _is_valid_chainable_output(output, ["array", "timeseries"]) is True

    def test_all_data_output_types_are_valid(self):
        from api.services.plugin_service import (
            _is_valid_chainable_output,
            DATA_OUTPUT_TYPES,
        )

        for output_type in DATA_OUTPUT_TYPES:
            output = {"type": output_type}
            assert _is_valid_chainable_output(output, None) is True


class TestBuildOutputReference:
    def test_builds_complete_reference(self):

        from api.services.plugin_service import _build_output_reference

        execution = {"id": "exec-1", "created_at": "2026-09-22"}
        plugin_info = {"id": "plugin123", "name": "Test Plugin"}
        output = {"id": "out1", "label": "Output 1", "type": "array"}

        result = _build_output_reference(
            execution, plugin_info, output, "ws-1", "meas-1"
        )

        assert result["plugin_id"] == "plugin123"
        assert result["plugin_name"] == "Test Plugin"
        assert result["execution_id"] == "exec-1"
        assert result["output_id"] == "out1"
        assert result["output_label"] == "Output 1"
        assert result["output_type"] == "array"
        assert result["workspace_id"] == "ws-1"
        assert result["measurement_id"] == "meas-1"


class TestExtractOutputsFromExecution:
    def test_extracts_valid_outputs(self):
        from api.services.plugin_service import _extract_outputs_from_execution

        execution = {
            "id": "exec-1",
            "created_at": "2026-09-22",
            "results": {"out1": [1, 2, 3], "out2": {"x": 1}},
            "user_plugins": {
                "id": "plugin123",
                "name": "Test",
                "config": {
                    "outputs": [
                        {"id": "out1", "label": "Array", "type": "array"},
                        {"id": "out2", "label": "Plot", "type": "plot"},
                    ]
                },
            },
        }

        result = _extract_outputs_from_execution(
            execution, "ws-1", "meas-1", None, None
        )

        assert len(result) == 1
        assert result[0]["output_id"] == "out1"

    def test_filters_by_plugin_id(self):
        from api.services.plugin_service import _extract_outputs_from_execution

        execution = {
            "id": "exec-1",
            "created_at": "2026-09-22",
            "results": {"out1": [1, 2]},
            "user_plugins": {
                "id": "plugin123",
                "name": "Test",
                "config": {"outputs": [{"id": "out1", "label": "A", "type": "array"}]},
            },
        }

        result = _extract_outputs_from_execution(
            execution, "ws-1", "meas-1", None, ["other-plugin"]
        )

        assert len(result) == 0

    def test_skips_outputs_without_results(self):
        from api.services.plugin_service import _extract_outputs_from_execution

        execution = {
            "id": "exec-1",
            "created_at": "2026-09-22",
            "results": {},
            "user_plugins": {
                "id": "plugin123",
                "name": "Test",
                "config": {"outputs": [{"id": "out1", "label": "A", "type": "array"}]},
            },
        }

        result = _extract_outputs_from_execution(
            execution, "ws-1", "meas-1", None, None
        )

        assert len(result) == 0


class TestGetAvailableOutputsForChaining:
    def test_returns_empty_when_no_executions(self, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = []
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import get_available_outputs_for_chaining

            result = get_available_outputs_for_chaining(
                "ws-1", "meas-1", sample_user_id
            )

            assert result == []

    def test_returns_chainable_outputs(self, sample_user_id):
        with patch("api.services.plugin_service.get_supabase_admin") as mock_admin:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "id": "exec-1",
                    "plugin_id": "plugin123",
                    "created_at": "2026-09-22",
                    "results": {"arr": [1, 2, 3]},
                    "user_plugins": {
                        "id": "plugin123",
                        "user_id": sample_user_id,
                        "name": "Test Plugin",
                        "config": {
                            "outputs": [
                                {"id": "arr", "label": "Array Output", "type": "array"}
                            ]
                        },
                    },
                }
            ]
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = (
                mock_response
            )
            mock_admin.return_value = mock_client

            from api.services.plugin_service import get_available_outputs_for_chaining

            result = get_available_outputs_for_chaining(
                "ws-1", "meas-1", sample_user_id
            )

            assert len(result) == 1
            assert result[0]["output_id"] == "arr"
            assert result[0]["output_type"] == "array"


class TestGetChainedInputData:
    def test_returns_output_data(self, sample_user_id):
        with patch("api.services.plugin_service.get_execution_by_id") as mock_get:
            mock_get.return_value = {
                "results": {"out1": [1, 2, 3, 4, 5]},
                "user_plugins": {"user_id": sample_user_id},
            }

            from api.services.plugin_service import get_chained_input_data

            result = get_chained_input_data("exec-1", "out1", sample_user_id)

            assert result == [1, 2, 3, 4, 5]

    def test_raises_when_execution_not_found(self, sample_user_id):
        with patch("api.services.plugin_service.get_execution_by_id") as mock_get:
            mock_get.return_value = None

            from api.services.plugin_service import get_chained_input_data

            with pytest.raises(ValueError, match="Execution not found"):
                get_chained_input_data("nonexistent", "out1", sample_user_id)

    def test_raises_when_access_denied(self, sample_user_id):
        with patch("api.services.plugin_service.get_execution_by_id") as mock_get:
            mock_get.return_value = {
                "results": {"out1": [1, 2]},
                "user_plugins": {"user_id": "other-user"},
            }

            from api.services.plugin_service import get_chained_input_data

            with pytest.raises(ValueError, match="Access denied"):
                get_chained_input_data("exec-1", "out1", sample_user_id)

    def test_raises_when_output_not_found(self, sample_user_id):
        with patch("api.services.plugin_service.get_execution_by_id") as mock_get:
            mock_get.return_value = {
                "results": {"out1": [1, 2]},
                "user_plugins": {"user_id": sample_user_id},
            }

            from api.services.plugin_service import get_chained_input_data

            with pytest.raises(ValueError, match="not found"):
                get_chained_input_data("exec-1", "nonexistent", sample_user_id)
