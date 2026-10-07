#!/bin/bash

FRONTEND_URL="${1:-https://fullsms.duckdns.org}"
OUTPUT_DIR="./nfr_results/performance"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$OUTPUT_DIR"

echo "=== NFR1.1 Page Load Performance Test ==="
echo "URL: $FRONTEND_URL"
echo ""

if ! command -v npx &> /dev/null; then
  echo "ERROR: npx not found"
  exit 1
fi

npx lighthouse "$FRONTEND_URL" \
  --output=json,html \
  --output-path="$OUTPUT_DIR/lighthouse_${TIMESTAMP}" \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance \
  --preset=desktop \
  --quiet

RESULTS_JSON="$OUTPUT_DIR/lighthouse_${TIMESTAMP}.report.json"

if [ -f "$RESULTS_JSON" ]; then
  LCP=$(cat "$RESULTS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['audits']['largest-contentful-paint']['numericValue'])")
  FCP=$(cat "$RESULTS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['audits']['first-contentful-paint']['numericValue'])")
  TBT=$(cat "$RESULTS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['audits']['total-blocking-time']['numericValue'])")
  CLS=$(cat "$RESULTS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['audits']['cumulative-layout-shift']['numericValue'])")
  PERF_SCORE=$(cat "$RESULTS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(int(d['categories']['performance']['score']*100))")

  echo "Results:"
  echo "--------"
  printf "Performance Score: %d/100\n" "$PERF_SCORE"
  printf "LCP: %.0fms (threshold: <= 2100ms)\n" "$LCP"
  printf "FCP: %.0fms (threshold: < 1000ms)\n" "$FCP"
  printf "TBT: %.0fms (threshold: < 100ms)\n" "$TBT"
  printf "CLS: %.3f (threshold: = 0)\n" "$CLS"
  echo ""

  PASS=true
  LCP_INT=${LCP%.*}
  FCP_INT=${FCP%.*}
  TBT_INT=${TBT%.*}

  [ "$LCP_INT" -gt 2100 ] && echo "FAIL: LCP exceeds threshold" && PASS=false || echo "PASS: LCP"
  [ "$FCP_INT" -ge 1000 ] && echo "FAIL: FCP exceeds threshold" && PASS=false || echo "PASS: FCP"
  [ "$TBT_INT" -ge 100 ] && echo "FAIL: TBT exceeds threshold" && PASS=false || echo "PASS: TBT"

  CLS_CHECK=$(echo "$CLS > 0.01" | bc -l 2>/dev/null || echo "0")
  [ "$CLS_CHECK" = "1" ] && echo "FAIL: CLS exceeds threshold" && PASS=false || echo "PASS: CLS"

  echo ""
  echo "Report: $OUTPUT_DIR/lighthouse_${TIMESTAMP}.report.html"
  echo ""
  [ "$PASS" = true ] && echo "OVERALL: PASS" && exit 0 || echo "OVERALL: FAIL" && exit 1
else
  echo "ERROR: Lighthouse failed"
  exit 1
fi
