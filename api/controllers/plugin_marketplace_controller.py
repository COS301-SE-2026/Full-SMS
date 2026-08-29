from typing import Optional
from fastapi import HTTPException
from api.services import plugin_marketplace_service, plugin_service


def submit_marketplace_plugin_controller(plugin_id: str, user_id: str) -> dict:
    try:
        plugin = plugin_marketplace_service.submit_marketplace_plugin(
            plugin_id, user_id
        )
        return {
            "success": True,
            "message": "Plugin submitted for review successfully",
            "data": plugin,
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit plugin: {str(error)}"
        )


def cancel_plugin_submission_controller(plugin_id: str, user_id: str) -> dict:
    try:
        plugin = plugin_marketplace_service.cancel_plugin_submission(plugin_id, user_id)
        return {
            "success": True,
            "message": "Plugin submission cancelled successfully",
            "data": plugin,
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Failed to cancel plugin submission: {str(error)}"
        )


def get_marketplace_plugins_controller() -> dict:
    try:
        plugins = plugin_marketplace_service.get_marketplace_plugins()
        return {
            "success": True,
            "message": "Marketplace plugins retrieved successfully",
            "data": plugins,
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve marketplace plugins: {str(error)}",
        )
