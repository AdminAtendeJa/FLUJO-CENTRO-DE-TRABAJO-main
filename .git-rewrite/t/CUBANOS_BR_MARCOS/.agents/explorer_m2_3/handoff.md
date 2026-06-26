# Handoff Report: Milestone 2 - Secure Credentials (R1)

## 1. Observation
We conducted a thorough audit across the codebase—specifically in both `DASHBOARDOperacional` (Operational Dashboard) and `DASHBOARDFinanciero` (Financial Dashboard)—to locate all occurrences of the Supabase secret key (`VITE_SUPABASE_SECRET_KEY`) and evaluate credential security.

### Occurrences of `VITE_SUPABASE_SECRET_KEY`
The environment variable name `VITE_SUPABASE_SECRET_KEY` is present in the following files:
1. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\src\supabaseClient.js`**
   - **Line 4**: `const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY`
   - **Line 7**: `console.error("Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_SECRET_KEY in your .env file.")`
   - **Line 10**: `export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseSecretKey || 'placeholder')`

2. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\.env`**
   - **Line 2**: `VITE_SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc3NCwiZXhwIjoyMDk2MjExNzc0fQ.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A`

3. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARD Operacional\.env`** (Active workspace fallback root directory)
   - **Line 2**: `VITE_SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc3NCwiZXhwIjoyMDk2MjExNzc0fQ.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A`

4. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\.env.example`**
   - **Line 3**: `VITE_SUPABASE_SECRET_KEY=your_supabase_service_key`

5. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\docker-compose.yml`**
   - **Line 10**: `- VITE_SUPABASE_SECRET_KEY=${VITE_SUPABASE_SECRET_KEY}`

6. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\Dockerfile`**
   - **Line 11**: `ARG VITE_SUPABASE_SECRET_KEY`
   - **Line 12**: `ENV VITE_SUPABASE_SECRET_KEY=$VITE_SUPABASE_SECRET_KEY`

### Exposure of the Secret Key Value in the Compiled Bundle
7. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\dist\assets\index-CF7vYsfw.js`**
   - A search for the secret token value (`Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A`) confirmed it is hardcoded in the production JavaScript build folder, exposing the `service_role` credential in plain text to anyone loading the application.

### Financial Dashboard Status (`DASHBOARDFinanciero`)
No occurrences of `VITE_SUPABASE_SECRET_KEY` or `SUPABASE_SECRET_KEY` were found in the `DASHBOARDFinanciero` codebase.
- The Financial Dashboard loads configuration from `window.SUPABASE_CONFIG` (populated at container runtime by `entrypoint.sh` using `SUPABASE_ANON_KEY`).
- Config template: `DASHBOARDFinanciero/config.template.js` only references `__SUPABASE_ANON_KEY__`.
- Environment example: `DASHBOARDFinanciero/.env.example` only references `SUPABASE_ANON_KEY` (line 5).

---

## 2. Logic Chain
1. **Compilation Behavior (Vite)**: Vite builds environment variables matching the `VITE_` prefix statically into the client-side JavaScript. This means `import.meta.env.VITE_SUPABASE_SECRET_KEY` is replaced by the raw string of the key during the build process, writing it into `dist/assets/index-CF7vYsfw.js`.
2. **Current Vulnerability**: The `VITE_SUPABASE_SECRET_KEY` variable currently contains the `service_role` secret token for Supabase. This token bypasses Row Level Security (RLS) entirely, giving anyone loading the UI administrative rights to read, write, or delete any record in the database.
3. **Corrective Strategy**:
   - The React UI client must use the public `anon` key instead. We need to replace the imports and usages of `VITE_SUPABASE_SECRET_KEY` with `VITE_SUPABASE_ANON_KEY`.
   - The environment files, Dockerfiles, and compose configurations must be updated to only inject `VITE_SUPABASE_ANON_KEY` to the builder and runtime environments.
   - The leaked `service_role` credential must be rotated immediately in the Supabase control panel because it was committed and built into the code.

---

## 3. Caveats
- **Credential Rotation Required**: Modifying the codebase does not deactivate the compromised `service_role` key. The administrator must rotate the API key in the Supabase Dashboard (`Settings -> API -> JWT Settings`).
- **Dependency on RLS Policies**: When the public `anon` key is used, Supabase relies on Row Level Security (RLS) policies to protect data. Switching to `VITE_SUPABASE_ANON_KEY` without active RLS configurations could either lead to permissions errors (if RLS is enabled with no policies) or leave the tables fully open to public operations (if RLS is disabled). Milestone 4 is designated to deploy RLS migration scripts for the `clientes` table.
- **VITE_GROQ_API_KEY Exposure**: The `VITE_GROQ_API_KEY` was also observed to be baked into the client bundle. While out of scope for this milestone (R1), it represents a similar client-side credential exposure and should eventually be moved to a backend proxy or serverless function.

---

## 4. Conclusion & Strategy Recommendations
We recommend the following steps for the implementation phase:

### Step 1: Update client code in `DASHBOARDOperacional/src/supabaseClient.js`
Replace the usage of the secret key with the public anon key:
```javascript
// BEFORE
const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY
if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_SECRET_KEY in your .env file.")
}
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseSecretKey || 'placeholder')

// AFTER
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.")
}
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')
```

### Step 2: Update Environment configuration files
- In `DASHBOARDOperacional/.env` and `DASHBOARD Operacional/.env`:
  Remove `VITE_SUPABASE_SECRET_KEY` entirely.
  Add `VITE_SUPABASE_ANON_KEY` containing the public anon key.
- In `DASHBOARDOperacional/.env.example`:
  Replace `VITE_SUPABASE_SECRET_KEY=your_supabase_service_key` with `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`.

### Step 3: Update Container Build/Run scripts
- **`DASHBOARDOperacional/Dockerfile`**:
  Replace `ARG VITE_SUPABASE_SECRET_KEY` and `ENV VITE_SUPABASE_SECRET_KEY` with `ARG VITE_SUPABASE_ANON_KEY` and `ENV VITE_SUPABASE_ANON_KEY`.
- **`DASHBOARDOperacional/docker-compose.yml`**:
  Replace argument `- VITE_SUPABASE_SECRET_KEY=${VITE_SUPABASE_SECRET_KEY}` with `- VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}`.

---

## 5. Verification Method
After changes are implemented, the following checks will verify success:
1. **Static code search**:
   Ensure `VITE_SUPABASE_SECRET_KEY` is no longer present in the codebase (outside handoffs/documentation):
   ```powershell
   Get-ChildItem -Recurse -Exclude node_modules,dist,.git,.agents | Select-String -Pattern "VITE_SUPABASE_SECRET_KEY"
   ```
   This should return 0 results.
2. **Build test**:
   Build the application:
   ```bash
   cd DASHBOARDOperacional
   npm run build
   ```
   Ensure the build finishes without errors.
3. **Bundle audit**:
   Confirm that the `service_role` key's raw value is completely absent from the newly generated javascript files in `DASHBOARDOperacional/dist/assets/`.
