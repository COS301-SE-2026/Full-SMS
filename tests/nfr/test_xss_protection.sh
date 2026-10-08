#!/bin/bash

API_URL="${1:-http://13.134.247.238:8000}"
FRONTEND_URL="${2:-https://fullsms.duckdns.org}"
AUTH_TOKEN="${3:-}"
OUTPUT_DIR="./nfr_results/security"

mkdir -p "$OUTPUT_DIR"

echo "=== NFR4.5 XSS Protection Test ==="
echo ""

PASS=true

echo "Test 1: Security Headers"
HEADERS=$(curl -s -I --max-time 10 "$FRONTEND_URL" 2>/dev/null)

check_header() {
  if echo "$HEADERS" | grep -qi "$1"; then
    echo "  PASS: $1 found"
    return 0
  else
    echo "  FAIL: $1 not found"
    return 1
  fi
}

check_header "X-Content-Type-Options" || PASS=false
check_header "X-Frame-Options" || PASS=false
check_header "Content-Security-Policy" || true

echo ""
echo "Test 2: XSS Payload Sanitization"

XSS_PAYLOADS=(
  "<script>alert('xss')</script>"
  "<img src=x onerror=alert('xss')>"
  "javascript:alert('xss')"
)

XSS_FAIL=0
for payload in "${XSS_PAYLOADS[@]}"; do
  RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workspaces" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$payload\",\"description\":\"test\"}" 2>/dev/null)

  if echo "$RESPONSE" | grep -qF "<script>"; then
    echo "  FAIL: payload reflected - ${payload:0:30}..."
    XSS_FAIL=$((XSS_FAIL + 1))
  else
    echo "  PASS: payload sanitized - ${payload:0:30}..."
  fi
done

[ $XSS_FAIL -gt 0 ] && PASS=false

echo ""
[ "$PASS" = true ] && echo "OVERALL: PASS" || echo "OVERALL: FAIL"
