# Full-SMS Web - Testing Policy

## 1. Objectives

This document defines the testing standards, processes, and responsibilities for the Full-SMS Web project. Its purpose is to ensure the reliability of core analysis and functionality. 

## 2. Main Testing Type

**Backend Testing**
Pytest, covering services, controllers, and route-level logic in isolation.

## 3. Tools & Environments
| Purpose | Tool |
| --- | --- |
| Backend unit/testing | pytest, pytest-cov, pytest-asyncio/anyio |
| Coverage tracking | Codecov |
| CI | Github Actions |

## 4. Acceptance Criteria
 - All tests must pass in CI before a pull request must be merged into dev or main.
 - Minimum backend coverage: 50% overall, with newly developed service and controller components targeting ≥ 70%.

 ## 6. Roles & Responsibilities 

- Each team member is responsible for writing and maintaining test for features they own. 
- The team lead is responsible for ensuring CI gates are enforced

