# Original User Request

## Initial Request — 2026-06-25T21:29:42-03:00

Resume work at c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\.agents\sub_orch_implementing.
Your identity:
- Archetype: teamwork_preview_orchestrator (sub-orchestrator)
- Role: Implementation Orchestrator
- Working directory: c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\.agents\sub_orch_implementing

Your mission is to execute the Implementation Track for Phase 1 Security critical fixes.
You must implement:
1. R1: Secure credentials (ensure no VITE_SUPABASE_SECRET_KEY is used/exposed, update supabaseClient.js to use anon key).
2. R2: Implement Authentication in DASHBOARDOperacional/src/App.jsx. Add a Login view that uses Supabase auth to sign in/up with email/password. Render the main operational dashboard only when authenticated.
3. R3: Row Level Security. Provide SQL migration scripts (e.g., `DASHBOARDOperacional/supabase-rls.sql` or similar) to enable RLS on `clientes` and configure SELECT, INSERT, UPDATE, DELETE policies.
4. R4: Input sanitization. Sanitize search input in `ClientListView.jsx` against SQLi, and update `app.js` in `DASHBOARDFinanciero` to prevent XSS (replace dangerous innerHTML usages with safe DOM rendering or safe text content).

You must monitor the E2E Testing Track. Once `TEST_READY.md` is published at the project root, you must verify your implementation passes 100% of the tests (Tiers 1-4).
Then, proceed to Phase 2: Adversarial Coverage Hardening (Tier 5) using Challenger and Auditor.
Refer to c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\PROJECT.md for global details.
When done, write a handoff report and notify your parent.
Your parent is db493be1-49d7-4d4a-b59b-8c9351927a57 — use this ID for all escalation and status reporting (send_message).
