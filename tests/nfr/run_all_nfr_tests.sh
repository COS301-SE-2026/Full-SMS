#!/bin/bash

set -e

API_URL="${API_URL:-http://13.134.247.238:8000}"
FRONTEND_URL="${FRONTEND_URL:-https://fullsms.duckdns.org}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
SKIP_BROWSER=false
SKIP_LOAD=false
QUICK_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --frontend-url)
      FRONTEND_URL="$2"
      shift 2
      ;;
    --token)
      AUTH_TOKEN="$2"
      shift 2
      ;;
    --skip-browser)
      SKIP_BROWSER=true
      shift
      ;;
    --skip-load)
      SKIP_LOAD=true
      shift
      ;;
    --quick)
      QUICK_MODE=true
      SKIP_BROWSER=true
      SKIP_LOAD=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/nfr_results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/nfr_report_${TIMESTAMP}.md"

mkdir -p "$OUTPUT_DIR"/{performance,security,maintainability,availability,browser_compatibility}

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_SKIP=0

RESULT_NFR1_1="N/A"
RESULT_NFR1_3="N/A"
RESULT_NFR4_1="N/A"
RESULT_NFR4_4="N/A"
RESULT_NFR4_5="N/A"
RESULT_NFR4_6="N/A"
RESULT_NFR5_1="N/A"
RESULT_NFR6_1="N/A"

run_test() {
  local TEST_NAME="$1"
  local TEST_CMD="$2"

  echo ""
  echo "========================================"
  echo "  Running: $TEST_NAME"
  echo "========================================"

  if eval "$TEST_CMD"; then
    echo "PASS: $TEST_NAME"
    TOTAL_PASS=$((TOTAL_PASS + 1))
    return 0
  else
    echo "FAIL: $TEST_NAME"
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
    return 1
  fi
}

skip_test() {
  local TEST_NAME="$1"
  local REASON="$2"

  echo ""
  echo "SKIP: $TEST_NAME - $REASON"
  TOTAL_SKIP=$((TOTAL_SKIP + 1))
}

cat > "$REPORT_FILE" << EOF
# NFR Test Report

Generated: $(date)
API URL: $API_URL
Frontend URL: $FRONTEND_URL

EOF

echo ""
echo "============================================================"
echo "           Full SMS NFR Test Suite"
echo "============================================================"
echo ""
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "Output Directory: $OUTPUT_DIR"
echo ""

echo "## NFR1: Performance" >> "$REPORT_FILE"

if command -v npx &> /dev/null; then
  if run_test "NFR1.1 Page Load Performance (Lighthouse)" \
    "bash '$SCRIPT_DIR/test_performance_lighthouse.sh' '$FRONTEND_URL'"; then
    RESULT_NFR1_1="PASS"
  else
    RESULT_NFR1_1="FAIL"
  fi
  echo "- NFR1.1 Page Load: $RESULT_NFR1_1" >> "$REPORT_FILE"
else
  skip_test "NFR1.1 Page Load Performance" "npx/Node.js not found"
  RESULT_NFR1_1="SKIP"
  echo "- NFR1.1 Page Load: SKIP (Node.js required)" >> "$REPORT_FILE"
fi

if [ "$SKIP_LOAD" = false ] && command -v k6 &> /dev/null; then
  if run_test "NFR1.3 Concurrent User Capacity (k6)" \
    "k6 run --env API_URL='$API_URL' --env AUTH_TOKEN='$AUTH_TOKEN' '$SCRIPT_DIR/test_concurrent_users.js'"; then
    RESULT_NFR1_3="PASS"
  else
    RESULT_NFR1_3="FAIL"
  fi
  echo "- NFR1.3 Concurrent Users: $RESULT_NFR1_3" >> "$REPORT_FILE"
else
  skip_test "NFR1.3 Concurrent User Capacity" "k6 not found or skipped"
  RESULT_NFR1_3="SKIP"
  echo "- NFR1.3 Concurrent Users: SKIP" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "## NFR4: Security" >> "$REPORT_FILE"

API_HOST=$(echo "$API_URL" | sed -e 's|https://||' -e 's|http://||' -e 's|/.*||')
FRONTEND_HOST=$(echo "$FRONTEND_URL" | sed -e 's|https://||' -e 's|http://||' -e 's|/.*||')

if run_test "NFR4.1 HTTPS Encryption" \
  "bash '$SCRIPT_DIR/test_https_encryption.sh' '$API_HOST' '$FRONTEND_HOST'"; then
  RESULT_NFR4_1="PASS"
else
  RESULT_NFR4_1="FAIL"
fi
echo "- NFR4.1 HTTPS: $RESULT_NFR4_1" >> "$REPORT_FILE"

if command -v python3 &> /dev/null; then
  if run_test "NFR4.4 SQL Injection Prevention" \
    "python3 '$SCRIPT_DIR/test_sql_injection.py' --api-url '$API_URL' --token '$AUTH_TOKEN'"; then
    RESULT_NFR4_4="PASS"
  else
    RESULT_NFR4_4="FAIL"
  fi
  echo "- NFR4.4 SQL Injection: $RESULT_NFR4_4" >> "$REPORT_FILE"
else
  skip_test "NFR4.4 SQL Injection" "Python3 not found"
  RESULT_NFR4_4="SKIP"
  echo "- NFR4.4 SQL Injection: SKIP" >> "$REPORT_FILE"
fi

if run_test "NFR4.5 XSS Protection" \
  "bash '$SCRIPT_DIR/test_xss_protection.sh' '$API_URL' '$FRONTEND_URL' '$AUTH_TOKEN'"; then
  RESULT_NFR4_5="PASS"
else
  RESULT_NFR4_5="FAIL"
fi
echo "- NFR4.5 XSS Protection: $RESULT_NFR4_5" >> "$REPORT_FILE"

if run_test "NFR4.6 CORS Restrictions" \
  "bash '$SCRIPT_DIR/test_cors.sh' '$API_URL' '$FRONTEND_URL'"; then
  RESULT_NFR4_6="PASS"
else
  RESULT_NFR4_6="FAIL"
fi
echo "- NFR4.6 CORS: $RESULT_NFR4_6" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "## NFR5: Maintainability" >> "$REPORT_FILE"

if [ "$QUICK_MODE" = false ]; then
  if run_test "NFR5.1 Code Coverage" \
    "bash '$SCRIPT_DIR/test_code_coverage.sh' '$PROJECT_DIR'"; then
    RESULT_NFR5_1="PASS"
  else
    RESULT_NFR5_1="FAIL"
  fi
  echo "- NFR5.1 Code Coverage: $RESULT_NFR5_1" >> "$REPORT_FILE"
else
  skip_test "NFR5.1 Code Coverage" "Quick mode"
  RESULT_NFR5_1="SKIP"
  echo "- NFR5.1 Code Coverage: SKIP" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "## NFR6: Usability" >> "$REPORT_FILE"

if [ "$SKIP_BROWSER" = false ] && command -v npx &> /dev/null; then
  if run_test "NFR6.1 Browser Compatibility (Playwright)" \
    "cd '$PROJECT_DIR' && npx playwright test tests/nfr/test_browser_compatibility.spec.ts --reporter=list"; then
    RESULT_NFR6_1="PASS"
  else
    RESULT_NFR6_1="FAIL"
  fi
  echo "- NFR6.1 Browser Compatibility: $RESULT_NFR6_1" >> "$REPORT_FILE"
else
  skip_test "NFR6.1 Browser Compatibility" "Playwright not found or skipped"
  RESULT_NFR6_1="SKIP"
  echo "- NFR6.1 Browser Compatibility: SKIP" >> "$REPORT_FILE"
fi

echo ""
echo "============================================================"
echo "                    Test Summary"
echo "============================================================"
echo ""

cat >> "$REPORT_FILE" << EOF

## Summary

| Metric | Count |
|--------|-------|
| Passed | $TOTAL_PASS |
| Failed | $TOTAL_FAIL |
| Skipped | $TOTAL_SKIP |
| Total | $((TOTAL_PASS + TOTAL_FAIL + TOTAL_SKIP)) |

### Test Results

| NFR ID | Requirement | Result |
|--------|-------------|--------|
| NFR1.1 | Page Load Performance | $RESULT_NFR1_1 |
| NFR1.3 | Concurrent User Capacity | $RESULT_NFR1_3 |
| NFR4.1 | HTTPS Encryption | $RESULT_NFR4_1 |
| NFR4.4 | SQL Injection Prevention | $RESULT_NFR4_4 |
| NFR4.5 | XSS Protection | $RESULT_NFR4_5 |
| NFR4.6 | CORS Restrictions | $RESULT_NFR4_6 |
| NFR5.1 | Code Coverage | $RESULT_NFR5_1 |
| NFR6.1 | Browser Compatibility | $RESULT_NFR6_1 |
EOF

echo "Passed: $TOTAL_PASS"
echo "Failed: $TOTAL_FAIL"
echo "Skipped: $TOTAL_SKIP"
echo ""

if [ $TOTAL_FAIL -eq 0 ]; then
  echo "============================================================"
  echo "              ALL TESTS PASSED"
  echo "============================================================"
  OVERALL_RESULT="PASS"
else
  echo "============================================================"
  echo "              SOME TESTS FAILED"
  echo "============================================================"
  OVERALL_RESULT="FAIL"
fi

echo "" >> "$REPORT_FILE"
echo "Overall Result: $OVERALL_RESULT" >> "$REPORT_FILE"

echo ""
echo "Report saved to: $REPORT_FILE"
echo "Results directory: $OUTPUT_DIR"
echo ""

[ $TOTAL_FAIL -eq 0 ]
