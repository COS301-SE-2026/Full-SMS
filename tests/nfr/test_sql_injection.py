#!/usr/bin/env python3

import argparse
import json
import requests
import sys
from datetime import datetime
from pathlib import Path

SQL_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "admin'--",
    "' UNION SELECT * FROM users --",
    "'; DROP TABLE users; --",
    "1' AND SLEEP(5) --",
    "' AND 1=1 --",
]

SQL_ERROR_INDICATORS = [
    "sql syntax", "mysql", "postgresql", "sqlite", "ora-",
    "syntax error", "query failed", "database error"
]

def test_endpoint(method, url, param_name, payload, auth_token=None):
    headers = {"Content-Type": "application/json"}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    try:
        if method.upper() == "GET":
            response = requests.get(url, params={param_name: payload}, headers=headers, timeout=10)
        else:
            response = requests.post(url, json={param_name: payload}, headers=headers, timeout=10)

        body = response.text.lower()
        vulnerable = False

        for error in SQL_ERROR_INDICATORS:
            if error in body:
                vulnerable = True
                break

        return {"vulnerable": vulnerable, "status_code": response.status_code}

    except requests.exceptions.Timeout:
        return {"vulnerable": True, "error": "timeout"}
    except Exception as e:
        return {"vulnerable": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://13.134.247.238:8000")
    parser.add_argument("--token", default=None)
    args = parser.parse_args()

    print("=== NFR4.4 SQL Injection Test ===")
    print(f"API: {args.api_url}")
    print("")

    test_cases = [
        ("GET", f"{args.api_url}/api/v1/workspaces", "search"),
        ("GET", f"{args.api_url}/api/v1/plugins", "name"),
        ("POST", f"{args.api_url}/api/v1/workspaces", "name"),
    ]

    vulnerabilities = 0

    for method, url, param in test_cases:
        print(f"Testing: {method} {url} ({param})")
        for payload in SQL_PAYLOADS:
            result = test_endpoint(method, url, param, payload, args.token)
            if result.get("vulnerable"):
                vulnerabilities += 1
                print(f"  VULNERABLE: {payload[:30]}...")
            else:
                print(f"  SAFE: {payload[:30]}...")

    print("")
    print(f"Vulnerabilities found: {vulnerabilities}")
    print(f"OVERALL: {'FAIL' if vulnerabilities > 0 else 'PASS'}")
    sys.exit(1 if vulnerabilities > 0 else 0)


if __name__ == "__main__":
    main()
