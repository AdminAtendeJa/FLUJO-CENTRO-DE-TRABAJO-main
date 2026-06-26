# Handoff Report - explorer_testing_1

Analysis of security requirements R1 (Secure credentials) and R2 (Authentication), including findings and E2E static-analysis test suite specifications.

---

## 1. Observation
The following file contents, structures, and configurations were observed:

### R1 (Secure credentials) observations:
1. **Exposed Supabase service_role keys in `.env` files**:
   - File: `DASHBOARD Operacional/.env`
     ```env
     VITE_SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc3NCwiZXhwIjoyMDk2MjExNzc0fQ.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A
     ```
   - File: `DASHBOARDOperacional/.env`
     ```env
     VITE_SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcWttYXhrdXhsbGN5anpxYnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc3NCwiZXhwIjoyMDk2MjExNzc0fQ.Gwr_2NxAPbt1i0y7FpJCZGmpJdfGQl-NRUzngrSRk8A
     ```
2. **Supabase client initialization exposing secret key**:
   - File: `DASHBOARDOperacional/src/supabaseClient.js` (lines 3-10)
     ```javascript
     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
     const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY

     if (!supabaseUrl || !supabaseSecretKey) {
       console.error("Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_SECRET_KEY in your .env file.")
     }

     export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseSecretKey || 'placeholder')
     ```
3. **Environment examples & financial dashboard configurations**:
   - File: `DASHBOARDOperacional/.env.example` contains:
     ```env
     VITE_SUPABASE_SECRET_KEY=your_supabase_service_key
     ```
   - File: `DASHBOARDFinanciero/.env.example` references:
     ```env
     SUPABASE_URL=https://tu-proyecto.supabase.co
     SUPABASE_ANON_KEY=tu-anon-key-aqui
     ```
   - File: `DASHBOARDFinanciero/config.template.js` (lines 1-5):
     ```javascript
     window.SUPABASE_CONFIG = {
       url: '__SUPABASE_URL__',
       anonKey: '__SUPABASE_ANON_KEY__',
       ano: parseInt('__DASHBOARD_ANO__', 10) || 2026,
     };
     ```

### R2 (Authentication) observations:
1. **Lack of authentication in `App.jsx`**:
   - File: `DASHBOARDOperacional/src/App.jsx` currently immediately renders the `app-layout` view wrapper and the main UI screens (Trámites, Clientes, etc.) starting at line 91 without checking for a session, checking a user, or rendering a login panel:
     ```javascript
     return (
       <GlobalAiChatProvider selectedClientId={currentView === 'client' ? selectedClientId : null}>
         <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
     ```
2. **Lack of auth hooks / imports**:
   - No imports of `supabase` from `./supabaseClient` exist in `App.jsx`.
   - No `session` or `user` state variables exist in `App.jsx` (only `currentView`, `selectedClientId`, `globalSearch`, `isNewClientModalOpen`, and `theme`).

### Existing Test Suite observations:
- File: `DASHBOARDOperacional/test/e2e.test.js` contains a test list exported to `test/run-tests.js`. Tests are static checks that read file contents via `fs.readFileSync` and check structures using regex or string matchers.

---

## 2. Logic Chain
1. **R1 Leak Verification**: By analyzing the token payload from `.env` (decoding the middle part of the JWT), the value contains `"role":"service_role"`. Because `service_role` has full administrative database privileges and bypasses Row Level Security (RLS), it must never be exposed on the client side or placed in `.env` files loaded by frontend bundlers (like Vite which prefix client-accessible env variables with `VITE_`).
2. **R1 Key Patterns**: A key pattern signature for Supabase service role keys consists of:
   - Variable name matching: `/SUPABASE_SECRET_KEY|SERVICE_ROLE_KEY|SUPABASE_ADMIN_KEY/i`
   - JWT structure: Three dot-separated base64url segments (`header.payload.signature`)
   - Header prefix matching `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
   - Payload containing `"role":"service_role"` when decoded.
3. **R2 Current Defect**: Currently, `App.jsx` acts as the entry point but bypasses auth entirely. To implement R2 properly:
   - `App.jsx` must import `supabase` client.
   - It must call `supabase.auth.getSession()` on mount.
   - It must subscribe to `supabase.auth.onAuthStateChange`.
   - It must store the session/user in state and conditionally render a login screen if null.
4. **Test Suitability**: Since the current test infrastructure runs fast static checks using Node.js without full browser rendering, we can assert compliance statically by:
   - Scanning all project `.env`, `.env.example`, `.env.local` files, and source code files using `fs` and matching against the key patterns.
   - Reading `App.jsx` as a string and asserting the presence of `supabase.auth.getSession()`, `onAuthStateChange`, a state variable for session, unsubscribe handlers, conditional rendering, and the presence of form inputs like `type="email"` and `type="password"`.

---

## 3. Caveats
- This investigation is strictly read-only and did not implement changes to the codebase.
- The actual Supabase client and auth APIs are mocked implicitly by the static analysis (we check code structure, not live network calls).
- The test suite is designed as a static analysis runner. If a developer uses unusual obfuscation (e.g. importing keys dynamically from a remote endpoint or splitting strings across multiple files in a complex way), regex static checks may need adjustment, though boundary cases for string split and JWT decoding mitigate this.

---

## 4. Conclusion
1. **R1 Leak**: Supabase `service_role` keys are currently exposed in `.env` files in both `DASHBOARD Operacional` and `DASHBOARDOperacional`, and loaded in `src/supabaseClient.js` via `VITE_SUPABASE_SECRET_KEY`. This must be replaced with the public `VITE_SUPABASE_ANON_KEY`.
2. **R2 Redirection**: `App.jsx` does not currently protect the operational dashboard. It must be refactored to implement a session hook, conditional rendering, and a login component.
3. **Verification**: 20 static-analysis test cases (10 for R1, 10 for R2) have been specified below. They can be appended directly to the project's Node.js test suite (`test/e2e.test.js`) to enforce these policies during CI/CD.

---

## 5. Verification Method

### How to execute the tests:
Once implemented, run the following command in PowerShell/Command Prompt:
```bash
cd "c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDOperacional"
node test/run-tests.js
```
The test runner will exit with code `0` if all assertions pass, or code `1` showing exact failure reasons.

---

## Test Case Specifications (20 Cases)

Here are the 20 test cases designed to verify R1 and R2.

### Requirement R1: Secure Credentials (10 Cases)

#### Tier 1: Feature Coverage (5 Cases)
* **Test Case R1-T1-1**: `.env` files do not expose `VITE_SUPABASE_SECRET_KEY` or `SUPABASE_SECRET_KEY` with actual secrets.
  - *Implementation Logic*: Find all `.env` files in `DASHBOARDOperacional`, `DASHBOARD Operacional`, and `DASHBOARDFinanciero`. Verify that if `VITE_SUPABASE_SECRET_KEY` or `SUPABASE_SECRET_KEY` is present, its value is empty or equal to a placeholder (e.g., `your_supabase_service_key`).
* **Test Case R1-T1-2**: `.env.example` files contain only placeholders, not real credentials.
  - *Implementation Logic*: Scan `.env.example` files. Verify that no key value matches an active Supabase service_role JWT structure.
* **Test Case R1-T1-3**: Source files do not import or reference `VITE_SUPABASE_SECRET_KEY`.
  - *Implementation Logic*: Scan all JS/JSX files in `DASHBOARDOperacional/src` and JS files in `DASHBOARDFinanciero` for strings matching `import.meta.env.VITE_SUPABASE_SECRET_KEY` or `process.env.VITE_SUPABASE_SECRET_KEY`.
* **Test Case R1-T1-4**: Supabase Client initialization uses only `ANON_KEY`.
  - *Implementation Logic*: Scan `supabaseClient.js` (and financial configs) to check that the key passed to `createClient` is named `VITE_SUPABASE_ANON_KEY` or `anonKey` (and does not reference `secret` or `service_role` keys).
* **Test Case R1-T1-5**: Dist build files do not leak service_role keys.
  - *Implementation Logic*: Check if `dist/` directory exists. If yes, search all files within `dist/` for the Supabase JWT header signature `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`.

#### Tier 2: Boundary & Edge Cases (5 Cases)
* **Test Case R1-T2-1**: JWT Payload Decoding Inspection.
  - *Implementation Logic*: Use a regex `\beyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b` to extract any JWT tokens in source/env files. Base64url-decode the payload (the second segment) and assert that `"role":"service_role"` is NOT present in any decoded JSON.
* **Test Case R1-T2-2**: Nested/Sub-directory Env Check.
  - *Implementation Logic*: Recursively search all subdirectories of `src/`, `public/`, and `DASHBOARDFinanciero` for hidden `.env`, `.env.local`, `.env.production` files, asserting that no such files exist containing credentials.
* **Test Case R1-T2-3**: Check for dynamic string manipulation obfuscation.
  - *Implementation Logic*: Scan code for combinations of split Base64 JWT header strings (e.g., `"eyJhbGci" + "OiJIUzI1Ni"`) or base64 decode calls on strings starting with `eyJhbGci`.
* **Test Case R1-T2-4**: Validate that all environment variables related to Supabase are prefixed appropriately.
  - *Implementation Logic*: Check that no service role key or secret key is present under any other variable name (e.g. `VITE_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ADMIN`).
* **Test Case R1-T2-5**: Config template integrity.
  - *Implementation Logic*: Scan `DASHBOARDFinanciero/config.template.js` and verify it only contains template slots for `__SUPABASE_URL__` and `__SUPABASE_ANON_KEY__`, and does NOT contain any slots or default values for secret keys.

---

### Requirement R2: Authentication (10 Cases)

#### Tier 1: Feature Coverage (5 Cases)
* **Test Case R2-T1-1**: Session state variable is defined in `App.jsx`.
  - *Implementation Logic*: Scan `App.jsx` content to verify it contains state hooks for session or user tracking (e.g., `useState(null)` alongside `session` or `user`).
* **Test Case R2-T1-2**: Auth State Change subscription inside a React hook.
  - *Implementation Logic*: Verify that `App.jsx` contains `supabase.auth.onAuthStateChange` inside a `useEffect` hook to receive state changes dynamically.
* **Test Case R2-T1-3**: Initial session retrieval on mount.
  - *Implementation Logic*: Check that `App.jsx` contains `supabase.auth.getSession()` inside a `useEffect` to fetch session details immediately on app launch.
* **Test Case R2-T1-4**: Conditional rendering based on active session.
  - *Implementation Logic*: Assert that `App.jsx` has a check (e.g. `if (!session)`) to render a Login view/component and block/prevent rendering the dashboard's main container (`className="app-layout"`).
* **Test Case R2-T1-5**: Sign-out functionality integration.
  - *Implementation Logic*: Search `App.jsx` or layout components for a button or click trigger that invokes `supabase.auth.signOut()`.

#### Tier 2: Boundary & Edge Cases (5 Cases)
* **Test Case R2-T2-1**: Form inputs in Login panel.
  - *Implementation Logic*: Read `App.jsx` (or the rendered login component) and verify the existence of HTML input tags with `type="email"` and `type="password"`, as well as a submit handler calling `supabase.auth.signInWithPassword`.
* **Test Case R2-T2-2**: Initial loading state check to prevent UI flickering.
  - *Implementation Logic*: Verify `App.jsx` uses a loading state (e.g. `const [loading, setLoading] = useState(true)`) and renders a loading view or nothing until the initial `getSession()` call resolves.
* **Test Case R2-T2-3**: Clean up active auth subscription on unmount.
  - *Implementation Logic*: Ensure the `useEffect` hook that handles `onAuthStateChange` registers the returned subscription object and returns a cleanup function containing `subscription.unsubscribe()` or calls `unsubscribe()`.
* **Test Case R2-T2-4**: Error message state display in Login.
  - *Implementation Logic*: Verify that the Login component maintains an error state (e.g. `const [error, setError] = useState(...)`) and renders it within the UI if the `signInWithPassword` call returns an error.
* **Test Case R2-T2-5**: Hash route guards for unauthenticated users.
  - *Implementation Logic*: Verify that if `window.location.hash` changes, the application does not trigger view navigation if there is no active session (i.e. routing logic in `App.jsx` or route handlers checks for session/user active state).

---

## 6. Implementation Code Draft for `test/e2e.test.js`

Below is the code template that can be appended directly to the project's `test/e2e.test.js` file:

```javascript
// =========================================================================
// R1 & R2 Test Cases Addition
// =========================================================================

// Helpers for R1 & R2 scanning
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const operDir = path.resolve(rootDir, 'DASHBOARDOperacional');
const operSpacedDir = path.resolve(rootDir, 'DASHBOARD Operacional');
const finDir = path.resolve(rootDir, 'DASHBOARDFinanciero');

function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allOperationalFiles = getFilesRecursively(operDir);
const allSpacedOperationalFiles = getFilesRecursively(operSpacedDir);
const allFinancialFiles = getFilesRecursively(finDir);
const allCodeFiles = [...allOperationalFiles, ...allSpacedOperationalFiles, ...allFinancialFiles];

// Decode JWT to inspect role
function isServiceRoleJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    return payload.role === 'service_role';
  } catch (e) {
    return false;
  }
}

const r1AndR2Tests = [
  // R1: Secure Credentials (Tier 1)
  {
    id: 101,
    tier: 1,
    feature: 10,
    name: "R1-T1-1: No active Supabase secret key in operational dashboard .env",
    testFn: () => {
      const pathsToCheck = [
        path.join(operDir, '.env'),
        path.join(operSpacedDir, '.env'),
        path.join(finDir, '.env')
      ];
      for (const p of pathsToCheck) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          const match = content.match(/(?:VITE_)?SUPABASE_SECRET_KEY\s*=\s*(.+)/);
          if (match) {
            const val = match[1].trim();
            if (val && !val.includes('your_') && !val.includes('placeholder') && isServiceRoleJwt(val)) {
              return { pass: false, message: `Found active Supabase service_role JWT in ${p}` };
            }
          }
        }
      }
      return { pass: true, message: "No active Supabase secret/service_role keys found in .env files" };
    }
  },
  {
    id: 102,
    tier: 1,
    feature: 10,
    name: "R1-T1-2: Example env files contain only placeholder values",
    testFn: () => {
      const pathsToCheck = [
        path.join(operDir, '.env.example'),
        path.join(finDir, '.env.example')
      ];
      for (const p of pathsToCheck) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          const tokens = content.match(/eyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
          for (const token of tokens) {
            if (isServiceRoleJwt(token)) {
              return { pass: false, message: `Found active service_role JWT inside example file: ${p}` };
            }
          }
        }
      }
      return { pass: true, message: "No active service_role JWT inside example env files" };
    }
  },
  {
    id: 103,
    tier: 1,
    feature: 10,
    name: "R1-T1-3: Source files do not reference VITE_SUPABASE_SECRET_KEY",
    testFn: () => {
      const forbiddenRef = 'VITE_SUPABASE_SECRET_KEY';
      for (const file of allCodeFiles) {
        if (file.endsWith('.js') || file.endsWith('.jsx')) {
          if (file.includes('supabaseClient.js') || file.includes('e2e.test.js') || file.includes('progress.md')) continue;
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes(forbiddenRef)) {
            return { pass: false, message: `Exposed secret key reference found in ${file}` };
          }
        }
      }
      return { pass: true, message: "No source files reference VITE_SUPABASE_SECRET_KEY" };
    }
  },
  {
    id: 104,
    tier: 1,
    feature: 10,
    name: "R1-T1-4: Supabase Client uses only VITE_SUPABASE_ANON_KEY",
    testFn: () => {
      const clientPath = path.join(operDir, 'src/supabaseClient.js');
      if (!fs.existsSync(clientPath)) return { pass: false, message: "supabaseClient.js not found" };
      const content = fs.readFileSync(clientPath, 'utf8');
      const usesAnon = content.includes('VITE_SUPABASE_ANON_KEY');
      const usesSecret = content.includes('VITE_SUPABASE_SECRET_KEY');
      if (usesSecret) {
        return { pass: false, message: "supabaseClient.js still references VITE_SUPABASE_SECRET_KEY" };
      }
      return { pass: usesAnon, message: usesAnon ? "Client uses anon key" : "Client does not reference VITE_SUPABASE_ANON_KEY" };
    }
  },
  {
    id: 105,
    tier: 1,
    feature: 10,
    name: "R1-T1-5: Build output files do not leak service_role keys",
    testFn: () => {
      const distDir = path.join(operDir, 'dist');
      if (!fs.existsSync(distDir)) return { pass: true, message: "dist directory does not exist (pre-build)" };
      const distFiles = getFilesRecursively(distDir);
      for (const file of distFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const tokens = content.match(/eyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
        for (const token of tokens) {
          if (isServiceRoleJwt(token)) {
            return { pass: false, message: `Leaked service_role key found inside build file: ${file}` };
          }
        }
      }
      return { pass: true, message: "No leaked credentials in dist files" };
    }
  },

  // R1: Secure Credentials (Tier 2 - Boundary Cases)
  {
    id: 106,
    tier: 2,
    feature: 10,
    name: "R1-T2-1: Deep JWT Scan for service_role payload role values",
    testFn: () => {
      for (const file of allCodeFiles) {
        if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.env')) {
          if (file.includes('e2e.test.js') || file.includes('progress.md') || file.includes('handoff.md')) continue;
          const content = fs.readFileSync(file, 'utf8');
          const tokens = content.match(/eyJhbGci[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
          for (const token of tokens) {
            if (isServiceRoleJwt(token)) {
              return { pass: false, message: `Service role token detected in file: ${file}` };
            }
          }
        }
      }
      return { pass: true, message: "No service_role JWT payloads detected in any code or env files" };
    }
  },
  {
    id: 107,
    tier: 2,
    feature: 10,
    name: "R1-T2-2: Nested environment files scanner",
    testFn: () => {
      const nestedEnvFiles = allCodeFiles.filter(f => {
        const base = path.basename(f);
        return base.startsWith('.env') && !f.endsWith('.env.example') && 
               path.dirname(f) !== operDir && path.dirname(f) !== operSpacedDir && path.dirname(f) !== finDir;
      });
      if (nestedEnvFiles.length > 0) {
        return { pass: false, message: `Found forbidden nested env files: ${nestedEnvFiles.join(', ')}` };
      }
      return { pass: true, message: "No nested env files found" };
    }
  },
  {
    id: 108,
    tier: 2,
    feature: 10,
    name: "R1-T2-3: Detection of split string obfuscated service_role signatures",
    testFn: () => {
      const splitHeaderPattern = /"eyJhbGci"\s*\+\s*"OiJIUzI1Ni"/;
      for (const file of allCodeFiles) {
        if (file.endsWith('.js') || file.endsWith('.jsx')) {
          if (file.includes('e2e.test.js') || file.includes('progress.md') || file.includes('handoff.md')) continue;
          const content = fs.readFileSync(file, 'utf8');
          if (splitHeaderPattern.test(content)) {
            return { pass: false, message: `Potential split-string JWT header obfuscation in ${file}` };
          }
        }
      }
      return { pass: true, message: "No obvious split JWT token obfuscation detected" };
    }
  },
  {
    id: 109,
    tier: 2,
    feature: 10,
    name: "R1-T2-4: Prefix constraints for Supabase variables",
    testFn: () => {
      for (const file of allCodeFiles) {
        if (file.endsWith('.env')) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('VITE_SUPABASE_SERVICE_ROLE_KEY') || content.includes('SUPABASE_ADMIN_KEY')) {
            return { pass: false, message: `Exposed high-privilege Supabase env variable name in: ${file}` };
          }
        }
      }
      return { pass: true, message: "No forbidden Supabase high-privilege variables found" };
    }
  },
  {
    id: 110,
    tier: 2,
    feature: 10,
    name: "R1-T2-5: Client config templates check",
    testFn: () => {
      const configTplPath = path.join(finDir, 'config.template.js');
      if (!fs.existsSync(configTplPath)) return { pass: true, message: "config.template.js not present" };
      const content = fs.readFileSync(configTplPath, 'utf8');
      if (content.includes('SECRET') || content.includes('secret') || content.includes('service_role')) {
        return { pass: false, message: "config.template.js leaks secret references" };
      }
      return { pass: true, message: "config.template.js is clean" };
    }
  },

  // R2: Authentication (Tier 1)
  {
    id: 201,
    tier: 1,
    feature: 11,
    name: "R2-T1-1: App.jsx defines session state",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      if (!fs.existsSync(appPath)) return { pass: false, message: "App.jsx not found" };
      const content = fs.readFileSync(appPath, 'utf8');
      const hasSessionState = content.includes('session') && content.includes('setSession');
      return { pass: hasSessionState, message: hasSessionState ? "Session state hook found" : "No session/setSession state hook in App.jsx" };
    }
  },
  {
    id: 202,
    tier: 1,
    feature: 11,
    name: "R2-T1-2: App.jsx subscribes to auth state changes",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasAuthListener = content.includes('onAuthStateChange');
      return { pass: hasAuthListener, message: hasAuthListener ? "onAuthStateChange hook listener found" : "Missing onAuthStateChange listener in App.jsx" };
    }
  },
  {
    id: 203,
    tier: 1,
    feature: 11,
    name: "R2-T1-3: App.jsx checks initial session on mount",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasGetSession = content.includes('getSession');
      return { pass: hasGetSession, message: hasGetSession ? "getSession call found" : "Missing getSession call on mount in App.jsx" };
    }
  },
  {
    id: 204,
    tier: 1,
    feature: 11,
    name: "R2-T1-4: App.jsx conditionally renders login panel when session is null",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasLoginRender = content.includes('Login') || content.includes('login') || content.includes('!session');
      const hasAppLayoutGuard = content.includes('session ?') || content.includes('!session ?') || content.includes('if (!session)');
      const pass = hasLoginRender && hasAppLayoutGuard;
      return { pass, message: pass ? "Auth guard rendering flow detected" : "App.jsx lacks logic guarding app-layout when session is absent" };
    }
  },
  {
    id: 205,
    tier: 1,
    feature: 11,
    name: "R2-T1-5: App.jsx or layouts provide sign-out trigger",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasSignOut = content.includes('signOut') && content.includes('supabase');
      return { pass: hasSignOut, message: hasSignOut ? "Sign out handler found" : "No signOut handler found in App.jsx" };
    }
  },

  // R2: Authentication (Tier 2 - Boundary Cases)
  {
    id: 206,
    tier: 2,
    feature: 11,
    name: "R2-T2-1: Login UI Form exposes email and password inputs",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasEmailInput = content.includes('type="email"') || content.includes("type='email'");
      const hasPasswordInput = content.includes('type="password"') || content.includes("type='password'");
      const hasSignIn = content.includes('signInWithPassword');
      const pass = hasEmailInput && hasPasswordInput && hasSignIn;
      return { pass, message: pass ? "Form inputs and signIn API verified" : `Inputs check failed: email=${hasEmailInput}, password=${hasPasswordInput}, signIn=${hasSignIn}` };
    }
  },
  {
    id: 207,
    tier: 2,
    feature: 11,
    name: "R2-T2-2: App.jsx implements loading screen protection",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasLoadingState = content.includes('loading') && content.includes('setLoading');
      return { pass: hasLoadingState, message: hasLoadingState ? "Loading screen hooks found" : "No loading spinner/state verification to prevent flickering" };
    }
  },
  {
    id: 208,
    tier: 2,
    feature: 11,
    name: "R2-T2-3: Clean up active auth subscription on unmount",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasCleanup = content.includes('unsubscribe') || content.includes('subscription.unsubscribe');
      return { pass: hasCleanup, message: hasCleanup ? "Auth listener clean up registered" : "Missing unsubscribe cleanup function in App.jsx useEffect" };
    }
  },
  {
    id: 209,
    tier: 2,
    feature: 11,
    name: "R2-T2-4: Error handling inside login form",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const hasErrorDisplay = content.includes('error.message') || content.includes('setError') || content.includes('errorMessage');
      return { pass: hasErrorDisplay, message: hasErrorDisplay ? "Login error handler implemented" : "No error hooks/alerts rendered for incorrect login attempts" };
    }
  },
  {
    id: 210,
    tier: 2,
    feature: 11,
    name: "R2-T2-5: Hash route guards for unauthenticated views",
    testFn: () => {
      const appPath = path.join(operDir, 'src/App.jsx');
      const content = fs.readFileSync(appPath, 'utf8');
      const guardsHash = content.includes('hashchange') && (content.includes('!session') || content.includes('session'));
      return { pass: guardsHash, message: guardsHash ? "Guarded hash navigation routes detected" : "Hash routing useEffect has no auth session checks" };
    }
  }
];

// Append to tests list
tests.push(...r1AndR2Tests);
```
