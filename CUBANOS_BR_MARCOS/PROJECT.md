# Project: Phase 1 Security critical fixes for FLUJO-CENTRO-DE-TRABAJO

## Architecture
- React frontend: `DASHBOARDOperacional` (Operational Dashboard) uses Supabase JS client in `src/supabaseClient.js` to fetch and write data.
- Financial Dashboard: `DASHBOARDFinanciero` uses html/vanilla JS with `app.js` and dynamic config to communicate with Supabase.
- Database: Supabase postgres instance containing the `clientes` table.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Testing Track | Design and build the E2E test suite (static checks for security requirements) and write `TEST_READY.md` | None | IN_PROGRESS (Conv: 9a3c656c) |
| 2 | Secure Credentials | Rotate exposed credentials, remove VITE_SUPABASE_SECRET_KEY from frontend, configure Supabase Anon Key in `.env` and `supabaseClient.js` | M1 | IN_PROGRESS (Conv: 181969df) |
| 3 | Authenticate Dashboard | Add login view to `App.jsx`, enforce check for Supabase session, redirect unauthenticated users | M2 | IN_PROGRESS (Conv: 181969df) |
| 4 | Row Level Security | Generate SQL migration scripts to enable RLS on `clientes` and define SELECT, INSERT, UPDATE, DELETE policies | M2 | IN_PROGRESS (Conv: 181969df) |
| 5 | Input Sanitization | Add SQLi sanitization in `ClientListView.jsx` search and XSS sanitization in `DASHBOARDFinanciero/app.js` innerHTML | M2 | IN_PROGRESS (Conv: 181969df) |
| 6 | Verification & Audit | Run E2E test suite, run lint check, and run the Forensic Auditor | M3, M4, M5 | PLANNED |

## Interface Contracts
### Supabase Client
- Uses only `VITE_SUPABASE_ANON_KEY` or config-provided `anonKey`.
- Does NOT expose `service_role` keys or `VITE_SUPABASE_SECRET_KEY` in build output or `.env` files.

### Authentication Flow
- Root component (`App.jsx`) checks for current active session.
- If no session, displays a Login/Signup panel with email/password authentication.
- Upon successful login, sets active session and switches to the main Operational Dashboard view.
- Provides sign-out functionality.

### Row Level Security
- RLS enabled on `clientes` table.
- Policies restrict access based on authenticated user IDs.
