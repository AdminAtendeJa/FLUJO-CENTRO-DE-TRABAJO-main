# Plan - Phase 1 Security Critical Fixes

## Objectives
1. Define security requirements and E2E tests independently in E2E Testing Track.
2. Implement fixes in Implementation Track:
   - R1: Remove secret key from frontend, use only anon key.
   - R2: Add Supabase Auth redirect to operational dashboard.
   - R3: Generate SQL script for RLS on `clientes` table.
   - R4: Sanitize search input (SQLi) and innerHTML rendering (XSS).
3. Validate fixes against the E2E test suite.
4. Perform adversarial coverage hardening and integrity auditing.

## Milestones & Timeline
1. M1: Test framework design and test cases execution (Testing Track) -> Target: TEST_READY.md published.
2. M2: Code implementation of R1, R2, R3, R4 (Implementation Track).
3. M3: E2E Verification - verify all tests pass (Tiers 1-4).
4. M4: Adversarial Hardening (Tier 5) - challenger and reviewer verification.
5. M5: Forensic Integrity Audit.
6. M6: Final Handoff & Project Completion.
