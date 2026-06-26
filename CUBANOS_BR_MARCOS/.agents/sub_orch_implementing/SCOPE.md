# Scope: Implementation of Phase 1 Security critical fixes

## Architecture
- React frontend: `DASHBOARDOperacional` (Operational Dashboard) uses Supabase JS client in `src/supabaseClient.js` to fetch and write data.
- Financial Dashboard: `DASHBOARDFinanciero` uses html/vanilla JS with `app.js` and config to communicate with Supabase.
- Database: Supabase postgres instance containing the `clientes` table.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 2 | Secure Credentials | Ensure no VITE_SUPABASE_SECRET_KEY is used, update supabaseClient.js to use anon key | None | PLANNED |
| 3 | Authenticate Dashboard | Add login/signup view in DASHBOARDOperacional/src/App.jsx, check session, redirect | M2 | PLANNED |
| 4 | Row Level Security | Provide SQL migration scripts (e.g., supabase-rls.sql) to enable RLS on clientes and configure policies | M2 | PLANNED |
| 5 | Input Sanitization | Sanitize search input in ClientListView.jsx against SQLi, update app.js in DASHBOARDFinanciero to prevent XSS | M2 | PLANNED |
| 6 | E2E Verification & Audit | Verify 100% test pass on TEST_READY.md, run Challenger and Forensic Auditor | M3, M4, M5 | PLANNED |

## Interface Contracts
### Supabase Client
- Uses VITE_SUPABASE_ANON_KEY (anon key) for clients.
- Does not expose secret/service_role keys.

### Authentication
- App.jsx renders login component unless user session is valid.
- Main dashboard renders only when authenticated.
