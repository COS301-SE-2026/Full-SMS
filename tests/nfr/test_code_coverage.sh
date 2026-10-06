#!/bin/bash

PROJECT_DIR="${1:-$(pwd)}"
OUTPUT_DIR="./nfr_results/maintainability"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MIN_COVERAGE=50

mkdir -p "$OUTPUT_DIR"

echo "=== NFR5.1.1 Code Coverage Test ==="
echo "Project Directory: $PROJECT_DIR"
echo "Minimum Required Coverage: ${MIN_COVERAGE}%"
echo ""

if [ ! -d "$PROJECT_DIR/api" ]; then
  echo "ERROR: api directory not found in $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR/api" || exit 1

echo "Running backend tests with coverage..."
echo ""

python -m pytest \
  --cov=api \
  --cov-report=term \
  --cov-report=html:"$OUTPUT_DIR/htmlcov_${TIMESTAMP}" \
  --cov-report=json:"$OUTPUT_DIR/coverage_${TIMESTAMP}.json" \
  --cov-fail-under=$MIN_COVERAGE \
  -v \
  tests/ 2>&1 | tee "$OUTPUT_DIR/coverage_output_${TIMESTAMP}.log"

PYTEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "Coverage Analysis"
echo ""

if [ -f "$OUTPUT_DIR/coverage_${TIMESTAMP}.json" ]; then
  TOTAL_COVERAGE=$(python3 -c "
import json
with open('$OUTPUT_DIR/coverage_${TIMESTAMP}.json') as f:
    data = json.load(f)
    print(f\"{data['totals']['percent_covered']:.1f}\")
")

  COVERED_LINES=$(python3 -c "
import json
with open('$OUTPUT_DIR/coverage_${TIMESTAMP}.json') as f:
    data = json.load(f)
    print(data['totals']['covered_lines'])
")

  TOTAL_LINES=$(python3 -c "
import json
with open('$OUTPUT_DIR/coverage_${TIMESTAMP}.json') as f:
    data = json.load(f)
    print(data['totals']['num_statements'])
")

  echo ""
  echo "Coverage Summary:"
  echo "Total Lines: $TOTAL_LINES"
  echo "Covered Lines: $COVERED_LINES"
  echo "Coverage: ${TOTAL_COVERAGE}%"
  echo "Threshold: >= ${MIN_COVERAGE}%"
  echo ""

  echo "Module Coverage Breakdown:"
  python3 -c "
import json
with open('$OUTPUT_DIR/coverage_${TIMESTAMP}.json') as f:
    data = json.load(f)
    files = data.get('files', {})
    for filepath, file_data in sorted(files.items()):
        pct = file_data['summary']['percent_covered']
        lines = file_data['summary']['num_statements']
        status = 'PASS' if pct >= 70 else 'WARN' if pct >= 50 else 'LOW'
        short_path = filepath.replace('$PROJECT_DIR/api/', '')
        print(f'  [{status}] {pct:5.1f}% ({lines:4d} lines) - {short_path}')
"

  echo ""

  if (( $(echo "$TOTAL_COVERAGE >= $MIN_COVERAGE" | bc -l) )); then
    echo "OVERALL: PASS"
    echo "Coverage ${TOTAL_COVERAGE}% meets minimum ${MIN_COVERAGE}%"
    FINAL_EXIT=0
  else
    echo "OVERALL: FAIL"
    echo "Coverage ${TOTAL_COVERAGE}% is below minimum ${MIN_COVERAGE}%"
    FINAL_EXIT=1
  fi

else
  echo "ERROR: Coverage report not generated"
  FINAL_EXIT=1
fi

echo ""
echo "Reports generated:"
echo "  HTML Report: $OUTPUT_DIR/htmlcov_${TIMESTAMP}/index.html"
echo "  JSON Report: $OUTPUT_DIR/coverage_${TIMESTAMP}.json"
echo "  Test Output: $OUTPUT_DIR/coverage_output_${TIMESTAMP}.log"
echo ""

exit $FINAL_EXIT
