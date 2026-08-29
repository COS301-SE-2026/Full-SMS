from typing import Optional
from fastapi import HTTPException
from api.services import plugin_marketplace_service, plugin_service


def submit_marketplace_plugin(plugin_id: str, user_id: str) -> dict:
    try:
        plugin = plugin_marketplace_service.submit_plugin_to_marketplace(
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
