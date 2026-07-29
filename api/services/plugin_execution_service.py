import os
from typing import Optional, Dict, Any
import httpx

EXECUTION_URL = os.environ.get("EXECUTION_URL")
EXECUTION_API_KEY = os.environ.get("EXECUTION_API_KEY")
EXECUTION_TIMEOUT = 90


def validate_script(script: str) -> Dict[str, Any]:
    dangerous_imports = [
        ("import os", "OS module import is not allowed"),
        ("import subprocess", "subprocess module import is not allowed"),
        ("import socket", "socket module import is not allowed"),
        ("import requests", "requests module import is not allowed"),
        ("import urllib", "urllib module import is not allowed"),
        ("import http", "http module import is not allowed"),
        ("__import__", "dynamic imports is not allowed"),
        ("exec(", "exec function is not allowed"),
        ("eval(", "eval function is not allowed"),
        ("open(", "open function is not allowed"),
        ("compile(", "compile function is not allowed"),
    ]

    for import_statement, error_message in dangerous_imports:
        if import_statement in script:
            return {"success": False, "error": error_message}

    try:
        compile(script, "<script>", "exec")

    except SyntaxError as error:
        return {"success": False, "error": f"Syntax error in script: {error}"}

    return {"success": True, "error": None}


def execute_plugin(
    script: str, parameters: Dict[str, Any], measurement_data: Dict[str, Any]
) -> Dict[str, Any]:
    if not EXECUTION_API_KEY:
        return {
            "success": False,
            "execution_id": "",
            "error": "Execution API key is not set",
            "execution_time": 0,
        }

    validation = validate_script(script)

    if not validation["success"]:
        return {
            "success": False,
            "execution_id": "",
            "error": f"Script validation failed: {validation['error']}",
            "execution_time": 0,
        }

    try:
        with httpx.Client(timeout=EXECUTION_TIMEOUT) as client:
            response = client.post(
                f"{EXECUTION_URL}/execute",
                json={
                    "script": script,
                    "parameters": parameters,
                    "measurement_data": measurement_data,
                    "api_key": EXECUTION_API_KEY,
                },
            )

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                return {
                    "success": False,
                    "execution_id": "",
                    "error": "Unauthorized: Invalid API key",
                    "execution_time": 0,
                }
            else:
                return {
                    "success": False,
                    "execution_id": "",
                    "error": f"Execution service returned status code {response.status_code}",
                    "execution_time": 0,
                }
    except httpx.TimeoutException:
        return {
            "success": False,
            "execution_id": "",
            "error": "Execution service request timed out",
            "execution_time": 1000 * EXECUTION_TIMEOUT,
        }

    except httpx.ConnectError:
        return {
            "success": False,
            "execution_id": "",
            "error": "Failed to connect to the execution service",
            "execution_time": 0,
        }
    except httpx.RequestError as error:
        return {
            "success": False,
            "execution_id": "",
            "error": f"An error occurred while requesting the execution service: {str(error)}",
            "execution_time": 0,
        }
