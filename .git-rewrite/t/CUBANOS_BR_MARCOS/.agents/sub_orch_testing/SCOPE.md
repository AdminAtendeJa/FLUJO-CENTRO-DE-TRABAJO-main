# Scope: E2E Testing Track

## Architecture
- React frontend: `DASHBOARDOperacional` (Operational Dashboard) uses Supabase JS client in `src/supabaseClient.js` to fetch and write data.
- Financial Dashboard: `DASHBOARDFinanciero` uses html/vanilla JS with `app.js` and dynamic config to communicate with Supabase.
- Database: Supabase postgres instance containing the `clientes` table.
- E2E Test Suite: Written in Node.js under `DASHBOARDOperacional/test/security.test.js` and executed via `node test/run-security-tests.js` (or similar).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Security Test Suite | Implement Node.js security static-analysis E2E test suite covering R1-R4 across Tiers 1-4. Write TEST_READY.md. | None | IN_PROGRESS |

## Interface Contracts
### R1: Secure credentials
- Frontends must only use Supabase Anon Key.
- No `VITE_SUPABASE_SECRET_KEY` or service role keys exposed in files or `.env` files.
### R2: Authentication
- Redirect unauthenticated users.
- Display a Login view.
- Perform session checks.
### R3: Row Level Security
- Must have a SQL migration script for RLS on `clientes` table.
### R4: Input sanitization
- ClientListView.jsx search uses SQLi prevention.
- DASHBOARDFinanciero app.js innerHTML uses XSS prevention.
