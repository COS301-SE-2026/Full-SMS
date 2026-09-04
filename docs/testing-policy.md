# Full-SMS Web - Testing Policy

## 1. Objectives

This document defines the testing standards, processes, and responsibilities for the Full-SMS Web project. Its purpose is to ensure the reliability of core analysis and functionality, and to give the team a single, consistent reference for how testing is structured, executed, and enforced.

## 3. Policy Overview
We believe that thorough testing is foundational to producing a high-quality, reliable application. Testing on this project is currently centered on the backend, verified at the following level:
* **Unit / Integration Testing (Backend):** Services, controllers, and route-level logic are tested in isolation using pytest, with dependencies mocked where appropriate to isolate the unit under test. Where tests exercise the interaction between services, controllers, and routes together, this also covers basic integration-level correctness.

## 3. Main Testing Type

**Backend Testing**
Pytest, covering services, controllers, and route-level logic in isolation.

## 4. Tools & Environments
| Purpose | Tool |
| --- | --- |
| Backend unit/testing | pytest, pytest-cov, pytest-asyncio/anyio |
| Coverage tracking & reporting | Codecov |
| CI | Github Actions |

Run the full backend test with : pytest


## 5. Acceptance Criteria
 - All tests must pass in CI before a pull request must be merged into dev or main.
 - Minimum backend coverage: 50% overall, with newly developed service and controller components targeting ≥ 70%.
 - Pull requests that drop overall coverage below the minimum threshold should not be merged

 ## 6. Roles & Responsibilities 

- Each team member is responsible for writing and maintaining test for features they own. 
- The team lead is responsible for ensuring CI gates are enforced and for reviewing coverage trends over time. 

