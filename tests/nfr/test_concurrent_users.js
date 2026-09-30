import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'error_rate': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://13.134.247.238:8000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  const endpoints = [
    { method: 'GET', url: `${BASE_URL}/api/v1/health` },
    { method: 'GET', url: `${BASE_URL}/api/v1/workspaces` },
    { method: 'GET', url: `${BASE_URL}/api/v1/plugins` },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.request(endpoint.method, endpoint.url, null, params);

  responseTime.add(res.timings.duration);
  errorRate.add(res.status >= 400);

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0;
  const errRate = data.metrics.error_rate ? data.metrics.error_rate.values.rate : 0;
  const totalReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const passed = p95 < 500 && errRate < 0.01;

  console.log(`
=== NFR1.3 Concurrent User Test ===
Virtual Users: 50
Duration: 3 minutes

Results:
- Total Requests: ${totalReqs}
- p95 Response Time: ${p95.toFixed(2)}ms (threshold: < 500ms)
- Error Rate: ${(errRate * 100).toFixed(3)}% (threshold: < 1%)

OVERALL: ${passed ? 'PASS' : 'FAIL'}
`);

  return {};
}
