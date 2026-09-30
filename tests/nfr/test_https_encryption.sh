#!/bin/bash

API_HOST="${1:-13.134.247.238}"
FRONTEND_HOST="${2:-fullsms.duckdns.org}"
OUTPUT_DIR="./nfr_results/security"

mkdir -p "$OUTPUT_DIR"

echo "=== NFR4.1 HTTPS Encryption Test ==="
echo ""

PASS=true

echo "Test 1: TLS Version"
TLS_OUTPUT=$(echo | openssl s_client -connect "$FRONTEND_HOST:443" -servername "$FRONTEND_HOST" 2>/dev/null)
TLS_VERSION=$(echo "$TLS_OUTPUT" | grep "Protocol" | head -1)

if echo "$TLS_VERSION" | grep -qE "TLSv1\.[23]"; then
  echo "  PASS: $TLS_VERSION"
else
  echo "  FAIL: TLS 1.2+ not detected"
  PASS=false
fi

echo ""
echo "Test 2: Certificate Validity"
CERT_DATES=$(echo | openssl s_client -connect "$FRONTEND_HOST:443" -servername "$FRONTEND_HOST" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

if [ -n "$CERT_DATES" ]; then
  echo "$CERT_DATES" | sed 's/^/  /'
  echo "  PASS: Certificate retrieved"
else
  echo "  FAIL: Could not retrieve certificate"
  PASS=false
fi

echo ""
echo "Test 3: HSTS Header"
HSTS=$(curl -s -I --max-time 10 "https://$FRONTEND_HOST" 2>/dev/null | grep -i "strict-transport-security")

if [ -n "$HSTS" ]; then
  echo "  PASS: $HSTS"
else
  echo "  WARN: HSTS header not found"
fi

echo ""
echo "Test 4: Cipher Strength"
CIPHER=$(echo | openssl s_client -connect "$FRONTEND_HOST:443" -servername "$FRONTEND_HOST" 2>/dev/null | grep "Cipher is")
if [ -n "$CIPHER" ]; then
  echo "  $CIPHER"
fi

echo ""
[ "$PASS" = true ] && echo "OVERALL: PASS" || echo "OVERALL: FAIL"
