# Handoff Report: Milestone 2 - Secure Credentials (R1)

## 1. Observation
We conducted a search across the entire workspace (`DASHBOARDOperacional`, `DASHBOARDFinanciero`, `chrome-extension`, and root workspace folders) to locate all occurrences of `VITE_SUPABASE_SECRET_KEY` and evaluate the credential configuration.

### Occurrences of `VITE_SUPABASE_SECRET_KEY`
The following files and line numbers contain references to `VITE_SUPABASE_SECRET_KEY`:
1. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\src\supabaseClient.js`**
   - **Line 4**: `const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY`
   - **Line 7**: `console.error("Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_SECRET_KEY in your .env file.")`
   - **Line 10**: `export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseSecretKey || 'placeholder')`

2. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\.env`**
   - **Line 2**: `VITE_SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc3NCwiZXhwIjoyMDk2MjExNzc0fQ.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A`

3. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARD Operacional\.env`** (Active workspace root fallback)
   - **Line 2**: `VITE_SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc3NCwiZXhwIjoyMDk2MjExNzc0fQ.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A`

4. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\.env.example`**
   - **Line 3**: `VITE_SUPABASE_SECRET_KEY=your_supabase_service_key`

5. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\docker-compose.yml`**
   - **Line 10**: `- VITE_SUPABASE_SECRET_KEY=${VITE_SUPABASE_SECRET_KEY}`

6. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\Dockerfile`**
   - **Line 11**: `ARG VITE_SUPABASE_SECRET_KEY`
   - **Line 12**: `ENV VITE_SUPABASE_SECRET_KEY=$VITE_SUPABASE_SECRET_KEY`

7. **`c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional\dist\assets\index-CF7vYsfw.js`** (Production Built Bundle)
   - **Exposed Secret Key**: The plain-text service_role JWT key is statically hardcoded in the build asset:
     `var Xa=Ja("https://rcqkmaxkuxllcyjzqbvn.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc3NCwiZXhwIjoyMDk2MjExNzc0fQ.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A")`

### Financial Dashboard status (`DASHBOARDFinanciero`)
No occurrences of `VITE_SUPABASE_SECRET_KEY` or `SUPABASE_SECRET_KEY` were found in `DASHBOARDFinanciero`.
The financial dashboard correctly references `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` inside `docker/entrypoint.sh`, `.env.example`, `config.template.js`, `docker-compose.yml`, and `Dockerfile`.

---

## 2. Logic Chain
1. **Exposure Mechanism**: React client-side applications built with Vite bundle environment variables prefixed with `VITE_` statically at build time. Any reference using `import.meta.env` will write the key directly into the compiled JavaScript files.
2. **Current Leaked Credential**: The token set for `VITE_SUPABASE_SECRET_KEY` is a Supabase `service_role` key (confirmed by decoding the JWT header indicating the admin role). 
3. **Risk Profile**: Instantiating the Supabase client with this secret key on the frontend exposes full administrative access to the database (bypassing RLS entirely) to any browser client loading the page.
4. **Resolution Strategy**:
   - `supabaseClient.js` must be refactored to read `VITE_SUPABASE_ANON_KEY` instead of `VITE_SUPABASE_SECRET_KEY`.
   - The `.env`, `.env.example`, `Dockerfile`, and `docker-compose.yml` config files in `DASHBOARDOperacional` and the root folder must be updated to pass `VITE_SUPABASE_ANON_KEY` instead of `VITE_SUPABASE_SECRET_KEY`.
   - The leaked `service_role` key must be rotated on the Supabase dashboard immediately to void any existing access.

---

## 3. Caveats
- **Credential Rotation**: Swapping the key in the code will not revoke the compromised secret key. The developer/owner must rotate the `service_role` token in the Supabase Dashboard settings under `Settings` -> `API` -> `JWT Settings`.
- **Row Level Security (RLS) Dependency**: When using the public `anon` key, the client is restricted to operations defined by database RLS policies. RLS must be active on all tables (specifically the `clientes` table) and have appropriate policies (Milestone 4) for the app to function securely. If policies are not configured properly, switching to the anon key could cause read/write failures or over-expose data.
- **Groq API Key Exposure**: During the investigation, it was observed that `VITE_GROQ_API_KEY` is also exposed in plain text in `dist/assets/index-CF7vYsfw.js`. While outside the strict scope of this milestone (R1), it represents a similar exposure risk and should be handled by routing AI requests through a secure backend or proxy instead of directly from client-side code.

---

## 4. Conclusion & Action Plan
We recommend implementing the following changes:

### Step 1: Update `DASHBOARDOperacional/src/supabaseClient.js`
Modify the file to use `VITE_SUPABASE_ANON_KEY` instead of `VITE_SUPABASE_SECRET_KEY`:
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

### Step 2: Update Environment Files
- **`DASHBOARDOperacional/.env` and `DASHBOARD Operacional/.env`**:
  Delete: `VITE_SUPABASE_SECRET_KEY=eyJhbGci...`
  Add: `VITE_SUPABASE_ANON_KEY=<actual_anon_public_key>`
- **`DASHBOARDOperacional/.env.example`**:
  Replace: `VITE_SUPABASE_SECRET_KEY=your_supabase_service_key`
  With: `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`

### Step 3: Update Docker and Compose configs
- **`DASHBOARDOperacional/docker-compose.yml`**:
  Replace line 10: `- VITE_SUPABASE_SECRET_KEY=${VITE_SUPABASE_SECRET_KEY}`
  With: `- VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}`
- **`DASHBOARDOperacional/Dockerfile`**:
  Replace lines 11-12:
  ```dockerfile
  ARG VITE_SUPABASE_SECRET_KEY
  ENV VITE_SUPABASE_SECRET_KEY=$VITE_SUPABASE_SECRET_KEY
  ```
  With:
  ```dockerfile
  ARG VITE_SUPABASE_ANON_KEY
  ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
  ```

---

## 5. Verification Method
1. **No Secret Key Occurrences**:
   Verify that `VITE_SUPABASE_SECRET_KEY` is not present in the workspace codebase (excluding `.agents` reports) by running:
   ```powershell
   Get-ChildItem -Recurse -Exclude node_modules,dist,.git,.agents | Select-String -Pattern "VITE_SUPABASE_SECRET_KEY"
   ```
   This command should return 0 results.
2. **Anon Key Configuration**:
   Verify that `VITE_SUPABASE_ANON_KEY` is referenced correctly:
   ```powershell
   Get-ChildItem -Recurse -Exclude node_modules,dist,.git,.agents | Select-String -Pattern "VITE_SUPABASE_ANON_KEY"
   ```
   This should return matches in `supabaseClient.js`, `.env`, `.env.example`, `Dockerfile`, and `docker-compose.yml`.
3. **Build Integrity Check**:
   Rebuild the application bundle:
   ```bash
   cd DASHBOARDOperacional
   npm run build
   ```
   Verify that the build completes successfully.
4. **Bundle Verification**:
   Inspect the newly built JavaScript file in `DASHBOARDOperacional/dist/assets/` to ensure the `service_role` JWT token is absent.
