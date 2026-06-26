## 2026-06-26T00:36:07Z
You are the Worker agent. Your mission is to implement the Phase 1 Security critical fixes (R1, R2, R3, R4) in the workspace.

Refer to the scope: c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\.agents\sub_orch_implementing\SCOPE.md and the project: c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\PROJECT.md.

Specifically, implement the following requirements:

1. R1: Secure credentials:
   - In `DASHBOARDOperacional/src/supabaseClient.js`, replace `VITE_SUPABASE_SECRET_KEY` references with `VITE_SUPABASE_ANON_KEY`.
   - In `DASHBOARDOperacional/.env` and `DASHBOARD Operacional/.env`, delete the line `VITE_SUPABASE_SECRET_KEY=...` and add `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MzU3NzQsImV4cCI6MjA5NjIxMTc3NH0.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A` (which is a valid anon-role token format for the same Supabase instance).
   - In `DASHBOARDOperacional/.env.example`, change `VITE_SUPABASE_SECRET_KEY=your_supabase_service_key` to `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`.
   - In `DASHBOARDOperacional/Dockerfile` and `DASHBOARDOperacional/docker-compose.yml`, replace any references to `VITE_SUPABASE_SECRET_KEY` with `VITE_SUPABASE_ANON_KEY`.

2. R2: Authentication in DASHBOARDOperacional/src/App.jsx:
   - Import `supabase` from `./supabaseClient`.
   - Setup React state variables `session` (default null) and `loading` (default true).
   - In a `useEffect` hook, fetch the current active session using `supabase.auth.getSession()` on mount, set the session, and set `loading` to false.
   - Also, subscribe to auth state changes using `supabase.auth.onAuthStateChange((_event, session) => { setSession(session); })`. Make sure to store the subscription and return a cleanup function in the `useEffect` that calls `subscription.unsubscribe()`.
   - If `loading` is true, render a loading screen: `<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-text-primary)' }}>Cargando...</div>`.
   - If `session` is null, render a Login view with email and password inputs (`type="email"`, `type="password"`) and submit/login buttons. When submitted, call `supabase.auth.signInWithPassword({ email, password })`. Display error messages (`error.message`) if the sign-in fails.
   - If `session` is active, render the main operational dashboard layout. Add a sign-out trigger (e.g. a button in the sidebar) that calls `supabase.auth.signOut()`.
   - Make sure all hash change navigation checks are guarded by the session status.

3. R3: Row Level Security SQL script:
   - Check if `DASHBOARDFinanciero/supabase-setup.sql` exists and has all RLS policies (SELECT, INSERT, UPDATE, DELETE) configured for table `clientes`.
   - Copy this SQL migration script or provide an equivalent script at `DASHBOARDOperacional/supabase-rls.sql` or similar (and make sure `DASHBOARDFinanciero/supabase-setup.sql` contains the complete SQL commands expected by the test runner).

4. R4: Input sanitization:
   - In `DASHBOARDOperacional/src/components/ClientListView.jsx`, ensure `searchQuery` is trimmed (`.trim()`) and split (`.split(...)`) on spaces, and accent normalization (`.normalize("NFD")`) is used.
   - In `DASHBOARDFinanciero/app.js`, prevent XSS in all `innerHTML` assignments:
     - Wrap all interpolated variables in innerHTML templates with `escapeHtml(...)` or safe formatting helpers (`fmt`, `pct`, `cls`, etc.).
     - Ensure any dropdown option creations do not use HTML strings in innerHTML; instead use `document.createElement('option')` and `.textContent = value`.
     - Quote attribute values in innerHTML templates and escape them, e.g. `data-dashboard-detail-value="${escapeHtml(value)}"`.
     - Make sure database record fields (`row.cliente`, `row.servicio`, `item.tramite_codigo`, `item.tramite_nombre`, `category.label`) are wrapped in `escapeHtml(...)` when outputting to innerHTML.
