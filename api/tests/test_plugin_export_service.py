import pytest
import json
import csv
import io
from unittest.mock import patch


class TestExportToCsv:
    def test_exports_array_data(self):
        from api.services.plugin_export_service import export_to_csv

        data = {"values": [1.0, 2.0, 3.0, 4.0, 5.0]}
        result = export_to_csv(data, "array")

        decoded = result.decode("utf-8")
        reader = csv.reader(io.StringIO(decoded))
        rows = list(reader)

        assert rows[0] == ["index", "value"]
        assert rows[1] == ["0", "1.0"]
        assert len(rows) == 6

    def test_exports_plain_array(self):
        from api.services.plugin_export_service import export_to_csv

        data = [10, 20, 30]
        result = export_to_csv(data, "array")

        decoded = result.decode("utf-8")
        assert "index,value" in decoded
        assert "0,10" in decoded

    def test_exports_timeseries_data(self):
        from api.services.plugin_export_service import export_to_csv

        data = {
            "time": [0.0, 1.0, 2.0],
            "values": [100, 200, 300],
            "timeUnit": "ms",
        }
        result = export_to_csv(data, "timeseries")

        decoded = result.decode("utf-8")
        assert "time (ms),value" in decoded
        assert "0.0,100" in decoded

    def test_exports_dataframe_data(self):
        from api.services.plugin_export_service import export_to_csv

        data = {
            "columns": [
                {"name": "x", "values": [1, 2, 3]},
                {"name": "y", "values": [4, 5, 6]},
            ]
        }
        result = export_to_csv(data, "dataframe")

        decoded = result.decode("utf-8")
        reader = csv.reader(io.StringIO(decoded))
        rows = list(reader)

        assert rows[0] == ["x", "y"]
        assert rows[1] == ["1", "4"]

    def test_exports_table_data(self):
        from api.services.plugin_export_service import export_to_csv

        data = {
            "columns": ["Name", "Value"],
            "rows": [["a", 1], ["b", 2]],
        }
        result = export_to_csv(data, "table")

        decoded = result.decode("utf-8")
        assert "Name,Value" in decoded
        assert "a,1" in decoded

    def test_fallback_for_dict(self):
        from api.services.plugin_export_service import export_to_csv

        data = {"key1": "value1", "key2": "value2"}
        result = export_to_csv(data, "unknown")

        decoded = result.decode("utf-8")
        assert "key,value" in decoded

    def test_fallback_for_list(self):
        from api.services.plugin_export_service import export_to_csv

        data = [1, 2, 3]
        result = export_to_csv(data, "unknown")

        decoded = result.decode("utf-8")
        assert "index,value" in decoded

    def test_handles_empty_dataframe(self):
        from api.services.plugin_export_service import export_to_csv

        data = {"columns": []}
        result = export_to_csv(data, "dataframe")

        decoded = result.decode("utf-8")
        assert decoded.strip() == ""


class TestExportToJson:
    def test_exports_any_data_as_json(self):
        from api.services.plugin_export_service import export_to_json

        data = {"values": [1, 2, 3], "label": "test"}
        result = export_to_json(data, "array")

        decoded = json.loads(result.decode("utf-8"))
        assert decoded["values"] == [1, 2, 3]
        assert decoded["label"] == "test"

    def test_handles_nested_structures(self):
        from api.services.plugin_export_service import export_to_json

        data = {
            "parameters": {"tau": 1.5},
            "metrics": {"chi_squared": 0.95},
        }
        result = export_to_json(data, "fitresult")

        decoded = json.loads(result.decode("utf-8"))
        assert decoded["parameters"]["tau"] == 1.5


class TestExportToExcel:
    def test_raises_without_openpyxl(self):
        with patch("api.services.plugin_export_service.HAS_OPENPYXL", False):
            from api.services.plugin_export_service import export_to_excel

            with pytest.raises(ImportError, match="openpyxl"):
                export_to_excel({"values": [1, 2]}, "array")

    def test_exports_array_to_excel(self):
        pytest.importorskip("openpyxl")
        from api.services.plugin_export_service import export_to_excel

        data = {"values": [1.0, 2.0, 3.0]}
        result = export_to_excel(data, "array")

        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_exports_timeseries_to_excel(self):
        pytest.importorskip("openpyxl")
        from api.services.plugin_export_service import export_to_excel

        data = {"time": [0, 1, 2], "values": [10, 20, 30], "timeUnit": "s"}
        result = export_to_excel(data, "timeseries")

        assert isinstance(result, bytes)

    def test_exports_dataframe_to_excel(self):
        pytest.importorskip("openpyxl")
        from api.services.plugin_export_service import export_to_excel

        data = {
            "columns": [
                {"name": "col1", "values": [1, 2]},
                {"name": "col2", "values": [3, 4]},
            ]
        }
        result = export_to_excel(data, "dataframe")

        assert isinstance(result, bytes)

    def test_exports_table_to_excel(self):
        pytest.importorskip("openpyxl")
        from api.services.plugin_export_service import export_to_excel

        data = {"columns": ["A", "B"], "rows": [[1, 2], [3, 4]]}
        result = export_to_excel(data, "table")

        assert isinstance(result, bytes)

    def test_exports_fitresult_to_excel(self):
        pytest.importorskip("openpyxl")
        from api.services.plugin_export_service import export_to_excel

        data = {
            "parameters": {"tau": 1.5, "amplitude": 100},
            "uncertainties": {"tau": 0.1},
            "metrics": {"chi_squared": 0.95},
        }
        result = export_to_excel(data, "fitresult")

        assert isinstance(result, bytes)

    def test_exports_dataset_to_excel(self):
        pytest.importorskip("openpyxl")
        from api.services.plugin_export_service import export_to_excel

        data = {
            "arrays": {
                "intensity": {"values": [1, 2, 3]},
                "time": {"values": [0.1, 0.2, 0.3]},
            }
        }
        result = export_to_excel(data, "dataset")

        assert isinstance(result, bytes)


class TestExportToHdf5:
    def test_raises_without_h5py(self):
        with patch("api.services.plugin_export_service.HAS_H5PY", False):
            from api.services.plugin_export_service import export_to_hdf5

            with pytest.raises(ImportError, match="h5py"):
                export_to_hdf5({"values": [1, 2]}, "array")

    def test_exports_array_to_hdf5(self):
        pytest.importorskip("h5py")
        from api.services.plugin_export_service import export_to_hdf5

        data = {"values": [1.0, 2.0, 3.0], "unit": "counts"}
        result = export_to_hdf5(data, "array")

        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_exports_timeseries_to_hdf5(self):
        pytest.importorskip("h5py")
        from api.services.plugin_export_service import export_to_hdf5

        data = {"time": [0, 1, 2], "values": [10, 20, 30], "timeUnit": "ns"}
        result = export_to_hdf5(data, "timeseries")

        assert isinstance(result, bytes)

    def test_exports_dataset_to_hdf5(self):
        pytest.importorskip("h5py")
        from api.services.plugin_export_service import export_to_hdf5

        data = {
            "arrays": {
                "intensity": {"values": [1, 2, 3], "unit": "counts"},
                "decay": {"values": [0.9, 0.8, 0.7]},
            },
            "metadata": {"sample": "test"},
        }
        result = export_to_hdf5(data, "dataset")

        assert isinstance(result, bytes)

    def test_exports_fitresult_to_hdf5(self):
        pytest.importorskip("h5py")
        from api.services.plugin_export_service import export_to_hdf5

        data = {
            "parameters": {"tau": 1.5},
            "uncertainties": {"tau": 0.1},
            "metrics": {"chi_squared": 0.95},
            "fitted_curve": {"x": [0, 1, 2], "y": [1, 0.5, 0.25]},
            "residuals": [0.01, -0.02, 0.01],
        }
        result = export_to_hdf5(data, "fitresult")

        assert isinstance(result, bytes)

    def test_exports_dataframe_to_hdf5(self):
        pytest.importorskip("h5py")
        from api.services.plugin_export_service import export_to_hdf5

        data = {
            "columns": [
                {"name": "x", "values": [1.0, 2.0], "dtype": "float64"},
                {"name": "label", "values": ["a", "b"], "dtype": "string"},
            ]
        }
        result = export_to_hdf5(data, "dataframe")

        assert isinstance(result, bytes)

    def test_fallback_stores_json_in_attrs(self):
        pytest.importorskip("h5py")
        from api.services.plugin_export_service import export_to_hdf5

        data = {"custom": "value"}
        result = export_to_hdf5(data, "unknown")

        assert isinstance(result, bytes)


class TestGetValidFormatsForType:
    def test_plot_formats(self):
        from api.services.plugin_export_service import get_valid_formats_for_type

        formats = get_valid_formats_for_type("plot")
        assert "png" in formats
        assert "pdf" in formats
        assert "svg" in formats
        assert "json" in formats

    def test_table_formats(self):
        from api.services.plugin_export_service import get_valid_formats_for_type

        formats = get_valid_formats_for_type("table")
        assert "csv" in formats
        assert "json" in formats
        assert "excel" in formats

    def test_array_formats(self):
        from api.services.plugin_export_service import get_valid_formats_for_type

        formats = get_valid_formats_for_type("array")
        assert "csv" in formats
        assert "json" in formats
        assert "hdf5" in formats

    def test_fitresult_formats(self):
        from api.services.plugin_export_service import get_valid_formats_for_type

        formats = get_valid_formats_for_type("fitresult")
        assert "json" in formats
        assert "hdf5" in formats
        assert "csv" not in formats

    def test_value_formats(self):
        from api.services.plugin_export_service import get_valid_formats_for_type

        formats = get_valid_formats_for_type("value")
        assert formats == ["json"]

    def test_unknown_type_defaults_to_json(self):
        from api.services.plugin_export_service import get_valid_formats_for_type

        formats = get_valid_formats_for_type("unknown_type")
        assert formats == ["json"]


class TestGetOutputConfig:
    def test_finds_output_by_id(self):
        from api.services.plugin_export_service import get_output_config

        execution = {
            "user_plugins": {
                "config": {
                    "outputs": [
                        {"id": "out1", "type": "array"},
                        {"id": "out2", "type": "table"},
                    ]
                }
            }
        }
        result = get_output_config(execution, "out2")

        assert result["type"] == "table"

    def test_returns_none_when_not_found(self):
        from api.services.plugin_export_service import get_output_config

        execution = {
            "user_plugins": {"config": {"outputs": [{"id": "out1", "type": "array"}]}}
        }
        result = get_output_config(execution, "nonexistent")

        assert result is None

    def test_handles_missing_config(self):
        from api.services.plugin_export_service import get_output_config

        execution = {"user_plugins": {}}
        result = get_output_config(execution, "out1")

        assert result is None


class TestExportPluginOutput:
    def test_raises_when_execution_not_found(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = None

            from api.services.plugin_export_service import export_plugin_output

            with pytest.raises(ValueError, match="Execution not found"):
                export_plugin_output("exec-id", "out-id", "json", "user-id")

    def test_raises_when_access_denied(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {"user_plugins": {"user_id": "other-user"}}

            from api.services.plugin_export_service import export_plugin_output

            with pytest.raises(ValueError, match="Access denied"):
                export_plugin_output("exec-id", "out-id", "json", "user-id")

    def test_raises_when_output_not_in_config(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {
                "user_plugins": {
                    "user_id": "user-id",
                    "config": {"outputs": []},
                },
                "results": {},
            }

            from api.services.plugin_export_service import export_plugin_output

            with pytest.raises(ValueError, match="not found in plugin config"):
                export_plugin_output("exec-id", "missing", "json", "user-id")

    def test_raises_when_output_not_exportable(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {
                "user_plugins": {
                    "user_id": "user-id",
                    "config": {
                        "outputs": [
                            {"id": "out1", "type": "array", "exportable": False}
                        ]
                    },
                },
                "results": {"out1": [1, 2, 3]},
            }

            from api.services.plugin_export_service import export_plugin_output

            with pytest.raises(ValueError, match="not exportable"):
                export_plugin_output("exec-id", "out1", "json", "user-id")

    def test_raises_when_format_invalid_for_type(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {
                "user_plugins": {
                    "user_id": "user-id",
                    "config": {"outputs": [{"id": "out1", "type": "value"}]},
                },
                "results": {"out1": 42},
            }

            from api.services.plugin_export_service import export_plugin_output

            with pytest.raises(ValueError, match="not supported"):
                export_plugin_output("exec-id", "out1", "csv", "user-id")

    def test_exports_json_successfully(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {
                "user_plugins": {
                    "user_id": "user-id",
                    "name": "Test Plugin",
                    "config": {"outputs": [{"id": "result", "type": "value"}]},
                },
                "results": {"result": 42},
            }

            from api.services.plugin_export_service import export_plugin_output

            result = export_plugin_output("exec-id", "result", "json", "user-id")

            assert result["content_type"] == "application/json"
            assert result["filename"] == "Test_Plugin_result.json"
            assert b"42" in result["content"]


class TestExportAllOutputs:
    def test_raises_when_execution_not_found(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = None

            from api.services.plugin_export_service import export_all_outputs

            with pytest.raises(ValueError, match="Execution not found"):
                export_all_outputs("exec-id", "json", "user-id")

    def test_exports_all_outputs_as_json(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {
                "user_plugins": {
                    "user_id": "user-id",
                    "name": "Test Plugin",
                    "config": {
                        "outputs": [
                            {"id": "out1", "type": "value", "label": "Value 1"},
                            {"id": "out2", "type": "array", "label": "Array 1"},
                        ]
                    },
                },
                "results": {"out1": 42, "out2": [1, 2, 3]},
            }

            from api.services.plugin_export_service import export_all_outputs

            result = export_all_outputs("exec-id", "json", "user-id")

            assert result["content_type"] == "application/json"
            assert "all_outputs" in result["filename"]

            data = json.loads(result["content"].decode("utf-8"))
            assert "out1" in data
            assert "out2" in data

    def test_skips_non_exportable_outputs(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {
                "user_plugins": {
                    "user_id": "user-id",
                    "name": "Test",
                    "config": {
                        "outputs": [
                            {"id": "out1", "type": "value"},
                            {"id": "out2", "type": "array", "exportable": False},
                        ]
                    },
                },
                "results": {"out1": 42, "out2": [1, 2, 3]},
            }

            from api.services.plugin_export_service import export_all_outputs

            result = export_all_outputs("exec-id", "json", "user-id")

            data = json.loads(result["content"].decode("utf-8"))
            assert "out1" in data
            assert "out2" not in data

    def test_raises_for_non_json_bulk_export(self):
        with patch(
            "api.services.plugin_export_service.get_execution_by_id"
        ) as mock_get:
            mock_get.return_value = {
                "user_plugins": {
                    "user_id": "user-id",
                    "name": "Test",
                    "config": {"outputs": []},
                },
                "results": {},
            }

            from api.services.plugin_export_service import export_all_outputs

            with pytest.raises(ValueError, match="only supports JSON"):
                export_all_outputs("exec-id", "csv", "user-id")
