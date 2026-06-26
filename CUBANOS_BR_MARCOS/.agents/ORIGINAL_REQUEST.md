# Original User Request

## Initial Request — 2026-06-25T21:27:20-03:00

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Teamwork multi-agent system is currently executing this prompt.

Implement Phase 1 Security critical fixes for the FLUJO-CENTRO-DE-TRABAJO platform, specifically rotating exposed credentials, adding Supabase Authentication, enforcing Row Level Security (RLS), and sanitizing inputs against SQL/XSS injections.

Integrity mode: demo
Working directory: c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS

## Requirements

### R1. Secure Credentials & Keys
Remove hardcoded exposed credentials from the frontend (`.env` files, `supabaseClient.js`) and ensure the application only uses the Supabase Anon Key.

### R2. Implement Authentication
Add Supabase Authentication to the Operational Dashboard (React) so that unauthenticated users are redirected to a login view and cannot access the main application.

### R3. Implement Row Level Security (RLS)
Provide the SQL migration scripts to enable Row Level Security (RLS) on relevant Supabase tables (e.g. `clientes`) ensuring users can only access permitted data.

### R4. Sanitize Inputs (Anti-Injection)
Add proper input sanitization to the search functionality in `ClientListView.jsx` (SQLi prevention) and `app.js` in the Financial Dashboard (XSS prevention for `innerHTML`).

## Verification Resources
- The agent team should use standard programmatic verification (e.g., test login flows, attempt to fetch data without authentication to verify RLS, check for key presence in frontend builds, and verify that search inputs are properly escaped).

## Acceptance Criteria

### Security & Authentication
- [ ] No Supabase Service Role keys or API keys are hardcoded in frontend source files.
- [ ] The `App.jsx` router enforces an authentication check (e.g. Supabase session exists) before rendering the main operational dashboard.
- [ ] Unauthenticated access to the main dashboard redirects to a login view.
- [ ] RLS SQL migration scripts are generated and correctly configure `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies on the `clientes` table.
- [ ] Search query inputs in `ClientListView.jsx` are sanitized before being passed to Supabase queries.
- [ ] `app.js` in the Financial Dashboard is updated to safely render DOM elements without raw `innerHTML` vulnerability.
