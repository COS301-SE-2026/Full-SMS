from fastapi import HTTPException, status
from api.services.plugin_service import (
    get_user_plugins,
    get_plugin_by_id,
    create_plugin,
    update_plugin,
    toggle_plugin,
    delete_plugin,
    update_installed_plugin,
)
from api.models.plugin import (
    PluginCreate,
    PluginUpdate,
    PluginToggle,
    PluginExecute,
)
from api.services.plugin_execution_service import execute_plugin
from api.services.measurement_service import get_measurement_data


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


def execute_plugin_controller(
    plugin_id: str, request: PluginExecute, user_id: str
) -> dict:
    try:
        plugin = get_plugin_by_id(plugin_id, user_id)

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
            parameters=request.parameters,
            measurement_data=measurement_data,
        )

        result_id = None

        if result["success"]:
            return {
                "success": True,
                "message": "Plugin executed successfully",
                "execution_id": result.get("execution_id", ""),
                "execution_time": result.get("execution_time", 0),
                "results": result.get("results", {}),
                "result_id": result_id,
            }
        else:
            return {
                "success": False,
                "message": "Plugin execution failed",
                "execution_id": result.get("execution_id", ""),
                "execution_time": result.get("execution_time", 0),
                "error": result.get("error"),
                "result_id": result_id,
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
