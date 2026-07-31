import json
from typing import Dict, Any, Optional

try:
    from api.utils.redis_Client import redisClient
    from api.services.analysis_services.cache_fallback import cache_fallback_service

    HAS_CACHE_SERVICES = True
except ImportError:
    HAS_CACHE_SERVICES = False


def get_measurement_data(
    upload_id: str, measurement_id: str
) -> Optional[Dict[str, Any]]:
    if not HAS_CACHE_SERVICES:
        print("Cache services not available")
        return None

    try:
        cache_key = f"raw_data:{upload_id}:{measurement_id}"
        print(f"Looking for cache key{cache_key}")
        cached_data = redisClient.get(cache_key)

        if not cached_data:
            print(f"Cache miss usingg fallback for upload {upload_id}")

            cache_fallback_service(upload_id)
            cached_data = redisClient.get(cache_key)

        if not cached_data:
            print(f"No data found{cache_key} even after fallback")
            return None

        print("Found cached data now parsiing...")
        raw_data = json.loads(cached_data)

        channel_data = raw_data.get("channel1", {})

        result = {
            "microtimes": channel_data.get("microtimes", []),
            "abstimes": channel_data.get("abstimes", []),
            "channel": 1,
            "metadata": raw_data.get("metadata", {}),
        }

        print(f"Returning measurement data with {len(result['microtimes'])} microtimes")
        return result

    except Exception as error:
        print(f"Error fetching measurement data: {error}")
        import traceback

        traceback.print_exc()
        return None
