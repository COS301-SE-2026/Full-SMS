#!/bin/bash

API_URL="${1:-http://13.134.247.238:8000}"
ALLOWED_ORIGIN="${2:-https://fullsms.duckdns.org}"
OUTPUT_DIR="./nfr_results/security"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$OUTPUT_DIR"

echo "=== NFR4.6.1 CORS Restriction Test ==="
echo "API URL: $API_URL"
echo "Expected Allowed Origin: $ALLOWED_ORIGIN"
echo ""

PASS=true
RESULTS=""

echo "Test 1: Preflight with Allowed Origin"
PREFLIGHT=$(curl -s -I -X OPTIONS "$API_URL/api/v1/health" \
  -H "Origin: $ALLOWED_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  --max-time 10 2>/dev/null)

ALLOW_ORIGIN=$(echo "$PREFLIGHT" | grep -i "Access-Control-Allow-Origin" | tr -d '\r')
ALLOW_METHODS=$(echo "$PREFLIGHT" | grep -i "Access-Control-Allow-Methods" | tr -d '\r')
ALLOW_HEADERS=$(echo "$PREFLIGHT" | grep -i "Access-Control-Allow-Headers" | tr -d '\r')

if [ -n "$ALLOW_ORIGIN" ]; then
  echo "  PASS: CORS headers returned for allowed origin"
  echo "  $ALLOW_ORIGIN"
  [ -n "$ALLOW_METHODS" ] && echo "  $ALLOW_METHODS"
  [ -n "$ALLOW_HEADERS" ] && echo "  $ALLOW_HEADERS"
  RESULTS="$RESULTS\nAllowed Origin Test: PASS"
else
  echo "  WARN: No CORS headers returned"
  RESULTS="$RESULTS\nAllowed Origin Test: WARN"
fi

echo ""
echo "Test 2: Request with Malicious Origin"
MALICIOUS_ORIGINS=(
  "https://evil-site.com"
  "https://attacker.example.com"
  "http://localhost:9999"
  "null"
)

BLOCKED_COUNT=0
for MALICIOUS in "${MALICIOUS_ORIGINS[@]}"; do
  RESPONSE=$(curl -s -I "$API_URL/api/v1/health" \
    -H "Origin: $MALICIOUS" \
    --max-time 10 2>/dev/null)

  CORS_HEADER=$(echo "$RESPONSE" | grep -i "Access-Control-Allow-Origin" | tr -d '\r')

  if echo "$CORS_HEADER" | grep -qi "$MALICIOUS"; then
    echo "  FAIL: Malicious origin allowed: $MALICIOUS"
    echo "        $CORS_HEADER"
    PASS=false
    RESULTS="$RESULTS\nMalicious Origin '$MALICIOUS': FAIL"
  elif [ -z "$CORS_HEADER" ]; then
    echo "  PASS: Origin blocked: $MALICIOUS"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    RESULTS="$RESULTS\nMalicious Origin '$MALICIOUS': PASS"
  elif echo "$CORS_HEADER" | grep -qi "$ALLOWED_ORIGIN"; then
    echo "  PASS: Only allowed origin returned: $MALICIOUS"
    BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    RESULTS="$RESULTS\nMalicious Origin '$MALICIOUS': PASS"
  else
    echo "  WARN: Unexpected CORS header for: $MALICIOUS"
    echo "        $CORS_HEADER"
    RESULTS="$RESULTS\nMalicious Origin '$MALICIOUS': WARN"
  fi
done

echo ""
echo "  Blocked: $BLOCKED_COUNT/${#MALICIOUS_ORIGINS[@]} malicious origins"

echo ""
echo "Test 3: Wildcard CORS Check"
WILDCARD_CHECK=$(curl -s -I "$API_URL/api/v1/health" \
  -H "Origin: https://random-site.com" \
  --max-time 10 2>/dev/null | grep -i "Access-Control-Allow-Origin")

if echo "$WILDCARD_CHECK" | grep -q "\*"; then
  echo "  FAIL: Wildcard (*) CORS is enabled"
  PASS=false
  RESULTS="$RESULTS\nWildcard CORS: FAIL"
else
  echo "  PASS: No wildcard CORS detected"
  RESULTS="$RESULTS\nWildcard CORS: PASS"
fi

echo ""
echo "Test 4: Credentials Handling"
CREDS_CHECK=$(curl -s -I "$API_URL/api/v1/health" \
  -H "Origin: $ALLOWED_ORIGIN" \
  --max-time 10 2>/dev/null | grep -i "Access-Control-Allow-Credentials")

if [ -n "$CREDS_CHECK" ]; then
  echo "  INFO: Credentials allowed"
  echo "  $CREDS_CHECK"

  if echo "$WILDCARD_CHECK" | grep -q "\*"; then
    echo "  FAIL: Credentials with wildcard origin is insecure"
    PASS=false
    RESULTS="$RESULTS\nCredentials Check: FAIL"
  else
    echo "  PASS: Credentials properly configured"
    RESULTS="$RESULTS\nCredentials Check: PASS"
  fi
else
  echo "  INFO: Credentials not explicitly allowed"
  RESULTS="$RESULTS\nCredentials Check: INFO"
fi

echo ""
echo "Test 5: Allowed HTTP Methods"
METHODS_CHECK=$(curl -s -I -X OPTIONS "$API_URL/api/v1/workspaces" \
  -H "Origin: $ALLOWED_ORIGIN" \
  -H "Access-Control-Request-Method: DELETE" \
  --max-time 10 2>/dev/null | grep -i "Access-Control-Allow-Methods")

if [ -n "$METHODS_CHECK" ]; then
  echo "  $METHODS_CHECK"

  if echo "$METHODS_CHECK" | grep -qiE "(TRACE|TRACK)"; then
    echo "  WARN: TRACE/TRACK methods should be disabled"
    RESULTS="$RESULTS\nHTTP Methods: WARN"
  else
    echo "  PASS: No dangerous methods exposed"
    RESULTS="$RESULTS\nHTTP Methods: PASS"
  fi
else
  echo "  INFO: No methods header returned"
  RESULTS="$RESULTS\nHTTP Methods: INFO"
fi

echo ""
if [ "$PASS" = true ]; then
  echo "OVERALL: PASS"
  echo -e "$RESULTS" > "$OUTPUT_DIR/cors_test_${TIMESTAMP}.txt"
  exit 0
else
  echo "OVERALL: FAIL"
  echo -e "$RESULTS" > "$OUTPUT_DIR/cors_test_${TIMESTAMP}.txt"
  exit 1
fi
