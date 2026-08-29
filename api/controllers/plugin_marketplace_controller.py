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


def get_marketplace_plugin_by_id_controller(plugin_id: str) -> dict:
    try:
        plugin = plugin_marketplace_service.get_marketplace_plugin_by_id(plugin_id)
        return {
            "success": True,
            "message": "Marketplace plugin retrieved successfully",
            "data": plugin,
        }

    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve marketplace plugin: {str(error)}",
        )


def install_marketplace_plugin_controller(plugin_id: str, user_id: str) -> dict:
    try:
        marketplace_plugin = plugin_marketplace_service.get_marketplace_plugin_by_id(
            plugin_id
        )

        new_plugin = plugin_service.create_plugin(
            user_id=user_id,
            name=marketplace_plugin["name"],
            description=marketplace_plugin["description"],
            version=marketplace_plugin["version"],
            config=marketplace_plugin["config"],
            script=marketplace_plugin["script"],
        )

        return {
            "success": True,
            "message": "Marketplace plugin installed successfully",
            "data": new_plugin,
        }

    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to install marketplace plugin: {str(error)}",
        )


def get_plugins_in_review_controller() -> dict:
    try:
        plugins = plugin_marketplace_service.get_plugins_in_review()
        return {
            "success": True,
            "message": "Marketplace plugins in review retrieved successfully",
            "data": plugins,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve marketplace plugins in review: {str(error)}",
        )
