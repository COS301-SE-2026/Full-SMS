from fastapi import HTTPException, status
from fastapi.responses import Response
from typing import List, Optional
from api.services.plugin_service import (
    get_user_plugins,
    get_plugin_by_id,
    create_plugin,
    update_plugin,
    toggle_plugin,
    delete_plugin,
    update_installed_plugin,
    get_available_outputs_for_chaining,
    get_latest_execution,
    save_plugin_execution,
    get_chained_input_data,
)
from api.models.plugin import (
    PluginCreate,
    PluginUpdate,
    PluginToggle,
    PluginExecute,
    PluginExportRequest,
    PluginExportAllRequest,
)
from api.services.plugin_execution_service import execute_plugin
from api.services.measurement_service import get_measurement_data
from api.services.plugin_export_service import (
    export_plugin_output,
    export_all_outputs,
)


def get_user_plugins_controller(user_id: str):
    try:
        plugins = get_user_plugins(user_id)
        return {"success": True, "plugins": plugins}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


def get_plugin_by_id_controller(plugin_id: str, user_id: str):
    try:
        plugin = get_plugin_by_id(plugin_id, user_id)
        return {"success": True, "plugin": plugin}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def create_plugin_controller(request: PluginCreate, user_id: str) -> dict:
    try:
        config_dict = {
            "parameters": [p.model_dump() for p in request.config.parameters],
            "outputs": [o.model_dump() for o in request.config.outputs],
            "requiredPackages": request.config.requiredPackages,
        }
        plugin = create_plugin(
            user_id=user_id,
            name=request.name,
            description=request.description,
            version=request.version,
            config=config_dict,
            script=request.script,
        )

        return {
            "success": True,
            "message": "Plugin created successfully",
            "plugin": plugin,
        }
    except ValueError as valerror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(valerror)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def update_plugin_controller(
    plugin_id: str, request: PluginUpdate, user_id: str
) -> dict:
    try:
        config_dict = None
        if request.config is not None:
            config_dict = {
                "parameters": [p.model_dump() for p in request.config.parameters],
                "outputs": [o.model_dump() for o in request.config.outputs],
                "requiredPackages": request.config.requiredPackages,
            }

        plugin = update_plugin(
            plugin_id=plugin_id,
            user_id=user_id,
            name=request.name,
            description=request.description,
            version=request.version,
            config=config_dict,
            script=request.script,
        )

        return {
            "success": True,
            "message": "Plugin updated successfully",
            "plugin": plugin,
        }
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def toggle_plugin_controller(
    plugin_id: str, request: PluginToggle, user_id: str
) -> dict:
    try:
        plugin = toggle_plugin(plugin_id, user_id, request.enabled)
        status_text = "enabled" if request.enabled else "disabled"
        return {
            "success": True,
            "message": f"Plugin {status_text} successfully",
            "plugin": plugin,
        }
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def delete_plugin_controller(plugin_id: str, user_id: str) -> dict:
    try:
        delete_plugin(plugin_id, user_id)
        return {"success": True, "message": "Plugin deleted successfully"}
    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def _resolve_chained_parameters(parameters: dict, user_id: str) -> dict:
    if not parameters:
        return parameters

    resolved = {}
    for key, value in parameters.items():
        if isinstance(value, str) and ":" in value and len(value.split(":")) == 2:
            parts = value.split(":")
            execution_id, output_id = parts[0], parts[1]
            if len(execution_id) >= 32:
                try:
                    chained_data = get_chained_input_data(
                        execution_id, output_id, user_id
                    )
                    resolved[key] = chained_data
                except Exception:
                    resolved[key] = value
            else:
                resolved[key] = value
        else:
            resolved[key] = value

    return resolved


def execute_plugin_controller(
    plugin_id: str, request: PluginExecute, user_id: str
) -> dict:
    try:
        plugin = get_plugin_by_id(plugin_id, user_id)

        resolved_parameters = _resolve_chained_parameters(request.parameters, user_id)

        measurement_data = None
        if request.measurement_data:
            measurement_data = request.measurement_data.model_dump()
        elif request.upload_id and request.measurement_id:
            measurement_data = get_measurement_data(
                upload_id=request.upload_id,
                measurement_id=request.measurement_id,
            )

        result = execute_plugin(
            script=plugin["script"],
            parameters=resolved_parameters,
            measurement_data=measurement_data,
        )

        result_id = None
        execution_id = ""

        if result["success"]:
            if request.workspace_id and request.measurement_id:
                saved = save_plugin_execution(
                    plugin_id=plugin_id,
                    workspace_id=request.workspace_id,
                    measurement_id=request.measurement_id,
                    user_id=user_id,
                    parameters=request.parameters or {},
                    results=result.get("results", {}),
                    execution_time_ms=int(result.get("execution_time", 0)),
                )
                execution_id = saved["id"]
                result_id = saved["id"]

            return {
                "success": True,
                "message": "Plugin executed successfully",
                "execution_id": execution_id,
                "execution_time": result.get("execution_time", 0),
                "results": result.get("results", {}),
                "result_id": result_id,
            }
        else:
            return {
                "success": False,
                "message": "Plugin execution failed",
                "execution_id": "",
                "execution_time": result.get("execution_time", 0),
                "error": result.get("error"),
                "result_id": None,
            }

    except ValueError as valerror:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(valerror))
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)
        )


def update_installed_plugin_controller(plugin_id: str, user_id: str) -> dict:
    try:
        plugin = update_installed_plugin(plugin_id, user_id)
        return {
            "success": True,
            "message": "Plugin updated to latest version",
            "plugin": plugin,
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def get_latest_execution_controller(
    plugin_id: str, workspace_id: str, measurement_id: str, user_id: str
) -> dict:
    try:
        execution = get_latest_execution(
            plugin_id=plugin_id,
            workspace_id=workspace_id,
            measurement_id=measurement_id,
            user_id=user_id,
        )
        return {
            "success": True,
            "execution": execution,
            "has_previous_result": execution is not None,
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def export_plugin_output_controller(request: PluginExportRequest, user_id: str):
    try:
        result = export_plugin_output(
            execution_id=request.execution_id,
            output_id=request.output_id,
            format=request.format.value,
            user_id=user_id,
        )
        return Response(
            content=result["content"],
            media_type=result["content_type"],
            headers={
                "Content-Disposition": f'attachment; filename="{result["filename"]}"'
            },
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except ImportError as ie:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(ie))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def export_all_outputs_controller(request: PluginExportAllRequest, user_id: str):
    try:
        result = export_all_outputs(
            execution_id=request.execution_id,
            format=request.format.value,
            user_id=user_id,
        )
        return Response(
            content=result["content"],
            media_type=result["content_type"],
            headers={
                "Content-Disposition": f'attachment; filename="{result["filename"]}"'
            },
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def get_available_outputs_controller(
    workspace_id: str,
    measurement_id: str,
    user_id: str,
    accepted_types: Optional[List[str]] = None,
    accepted_plugin_ids: Optional[List[str]] = None,
) -> dict:
    try:
        outputs = get_available_outputs_for_chaining(
            workspace_id=workspace_id,
            measurement_id=measurement_id,
            user_id=user_id,
            accepted_types=accepted_types,
            accepted_plugin_ids=accepted_plugin_ids,
        )
        return {"success": True, "outputs": outputs}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
