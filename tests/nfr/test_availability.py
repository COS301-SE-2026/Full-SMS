#!/usr/bin/env python3

import argparse
import json
import requests
import time
import sys
from datetime import datetime
from pathlib import Path

DEFAULT_CHECK_INTERVAL = 60
OUTPUT_DIR = Path("./nfr_results/availability")


def check_health(url, timeout=5):
    try:
        start = time.time()
        response = requests.get(f"{url}/health", timeout=timeout)
        duration = time.time() - start

        return {
            "timestamp": datetime.now().isoformat(),
            "status": "up" if response.status_code == 200 else "degraded",
            "response_time_ms": round(duration * 1000, 2),
            "status_code": response.status_code,
        }
    except requests.exceptions.Timeout:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "down",
            "response_time_ms": None,
            "error": "timeout",
        }
    except requests.exceptions.ConnectionError:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "down",
            "response_time_ms": None,
            "error": "connection_error",
        }
    except Exception as e:
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "down",
            "response_time_ms": None,
            "error": str(e),
        }


def calculate_uptime(results):
    if not results:
        return {"uptime_percent": 0, "total_checks": 0}

    total = len(results)
    up_count = sum(1 for r in results if r.get("status") == "up")
    degraded_count = sum(1 for r in results if r.get("status") == "degraded")
    down_count = sum(1 for r in results if r.get("status") == "down")

    response_times = [r["response_time_ms"] for r in results if r.get("response_time_ms")]
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0

    uptime_percent = (up_count / total) * 100 if total > 0 else 0

    return {
        "uptime_percent": round(uptime_percent, 2),
        "total_checks": total,
        "up_count": up_count,
        "degraded_count": degraded_count,
        "down_count": down_count,
        "avg_response_time_ms": round(avg_response_time, 2),
        "min_response_time_ms": min(response_times) if response_times else None,
        "max_response_time_ms": max(response_times) if response_times else None,
    }


def generate_report(results, api_url):
    stats = calculate_uptime(results)

    if not results:
        return "No data available for report."

    first_check = results[0]["timestamp"]
    last_check = results[-1]["timestamp"]

    try:
        start_dt = datetime.fromisoformat(first_check)
        end_dt = datetime.fromisoformat(last_check)
        duration = end_dt - start_dt
        duration_str = str(duration)
    except:
        duration_str = "Unknown"

    passed = stats["uptime_percent"] >= 99

    report = f"""
================================================================================
  NFR2.1.1 System Availability Report
================================================================================

Target: {api_url}
Monitoring Period: {first_check} to {last_check}
Duration: {duration_str}

Availability Statistics:
  Total Health Checks: {stats['total_checks']}
  Successful (UP): {stats['up_count']}
  Degraded: {stats['degraded_count']}
  Failed (DOWN): {stats['down_count']}

  UPTIME: {stats['uptime_percent']}%
  THRESHOLD: >= 99%

Response Time Statistics:
  Average: {stats['avg_response_time_ms']}ms
  Minimum: {stats['min_response_time_ms']}ms
  Maximum: {stats['max_response_time_ms']}ms

================================================================================
  RESULT: {'PASS' if passed else 'FAIL'}
================================================================================
"""
    return report


def monitor(api_url, frontend_url, interval, output_file):
    results = []

    if output_file.exists():
        with open(output_file) as f:
            data = json.load(f)
            results = data.get("checks", [])
            print(f"Loaded {len(results)} existing checks from {output_file}")

    print("=" * 60)
    print("  NFR2.1.1 Availability Monitor")
    print("=" * 60)
    print(f"API URL: {api_url}")
    if frontend_url:
        print(f"Frontend URL: {frontend_url}")
    print(f"Check Interval: {interval}s")
    print(f"Data File: {output_file}")
    print()
    print("Press Ctrl+C to stop and generate report")
    print("-" * 60)

    try:
        while True:
            api_result = check_health(api_url)
            api_result["endpoint"] = "api"
            results.append(api_result)

            if frontend_url:
                frontend_result = check_health(frontend_url)
                frontend_result["endpoint"] = "frontend"
                results.append(frontend_result)

            save_data = {
                "api_url": api_url,
                "frontend_url": frontend_url,
                "check_interval": interval,
                "checks": results,
                "last_updated": datetime.now().isoformat(),
            }
            with open(output_file, "w") as f:
                json.dump(save_data, f, indent=2)

            api_checks = [r for r in results if r.get("endpoint") == "api"]
            stats = calculate_uptime(api_checks)

            status_icon = "UP" if api_result["status"] == "up" else "DOWN"
            rt = api_result.get("response_time_ms", "N/A")
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {status_icon} | "
                  f"RT: {rt}ms | Uptime: {stats['uptime_percent']:.2f}% "
                  f"({stats['up_count']}/{stats['total_checks']})")

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n")
        print("Monitoring stopped.")
        print()

        api_checks = [r for r in results if r.get("endpoint") == "api"]
        report = generate_report(api_checks, api_url)
        print(report)

        report_file = output_file.parent / f"availability_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, "w") as f:
            f.write(report)
        print(f"Report saved to: {report_file}")

        stats = calculate_uptime(api_checks)
        sys.exit(0 if stats["uptime_percent"] >= 99 else 1)


def main():
    parser = argparse.ArgumentParser(description="NFR2.1.1 System Availability Test")
    parser.add_argument("--api-url", default="http://13.134.247.238:8000",
                        help="API base URL to monitor")
    parser.add_argument("--frontend-url", default=None,
                        help="Frontend URL to monitor (optional)")
    parser.add_argument("--interval", type=int, default=DEFAULT_CHECK_INTERVAL,
                        help="Check interval in seconds")
    parser.add_argument("--output-dir", default=str(OUTPUT_DIR),
                        help="Output directory for results")
    parser.add_argument("--report-only", action="store_true",
                        help="Generate report from existing data")
    parser.add_argument("--data-file", default=None,
                        help="Data file to use for report generation")

    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.report_only:
        if args.data_file:
            data_file = Path(args.data_file)
        else:
            data_files = list(output_dir.glob("availability_*.json"))
            if not data_files:
                print("No data files found. Run monitoring first.")
                sys.exit(1)
            data_file = max(data_files, key=lambda f: f.stat().st_mtime)

        print(f"Generating report from: {data_file}")
        with open(data_file) as f:
            data = json.load(f)

        api_checks = [r for r in data.get("checks", []) if r.get("endpoint") == "api"]
        report = generate_report(api_checks, data.get("api_url", "Unknown"))
        print(report)

        stats = calculate_uptime(api_checks)
        sys.exit(0 if stats["uptime_percent"] >= 99 else 1)
    else:
        output_file = output_dir / f"availability_{datetime.now().strftime('%Y%m%d')}.json"
        monitor(args.api_url, args.frontend_url, args.interval, output_file)


if __name__ == "__main__":
    main()
