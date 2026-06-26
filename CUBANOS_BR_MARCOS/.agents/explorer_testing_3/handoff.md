# Security Test Harness Design and Test Case Specifications

**Summary of Core Findings**: The codebase contains critical security vulnerabilities including client-side exposure of the database service role key (`VITE_SUPABASE_SECRET_KEY`) and Groq API key (`VITE_GROQ_API_KEY`), hardcoded JWT bearer authorization tokens in `n8n-kommo-workflow.json`, and fully permissive Row Level Security (RLS) policies in `supabase-setup.sql`. The designed security E2E test suite (`security.test.js` and `run-security-tests.js`) implements static analysis and regex assertions to automatically detect these credentials leaks, SQL injection vectors, and weak database configuration rules.

---

## 1. Observation

During read-only inspection of the repository codebase under `CUBANOS_BR_MARCOS\DASHBOARDOperacional`, the following security concerns were directly observed:

1. **Exposed Supabase Service Role Key**  
   - File: `src/supabaseClient.js`, lines 4-10:
     ```javascript
     const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY
     ...
     export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseSecretKey || 'placeholder')
     ```
   - Vite environment variables prefixed with `VITE_` are compiled and embedded directly in front-end JS bundles, exposing the service role admin key (which bypasses RLS) to anyone inspecting client-side assets in the browser.

2. **Exposed Third-Party LLM API Key**  
   - File: `src/services/aiService.js`, lines 20-26:
     ```javascript
     function getApiKey() {
       const key = import.meta.env.VITE_GROQ_API_KEY;
       if (!key || key.startsWith('pon_tu')) {
         throw new Error('No Groq API Key found. Agrega VITE_GROQ_API_KEY a tu archivo .env');
       }
       return key;
     }
     ```
   - The Groq API key is retrieved on the client side and injected into HTTP headers (`Authorization: Bearer ${getApiKey()}`) for direct browser-to-LLM traffic, exposing the key to potential quota exhaustion and billing abuse.

3. **Hardcoded Bearer Token in Workflow Nodes**  
   - File: `n8n-kommo-workflow.json`, lines 47 and 83:
     ```json
     "value": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImE5OWE4NWU3MGMxNGQ5Nzg5ZDY3MTc1OWRlZmU4M2QyZTc5ZDI2YTk2YzQ4ZjE5ZjIzNDExMzUwN2U3MzAyZThiZWIwNmYzMTllNjczY2I5In0.eyJhdWQiOiIyY2NjZmM4YS1lZTE4LTRkYTMtOWQ0My1hNzg0NzNiMzM5YzQiLCJqdGkiOiJhOTlhODVlNzBjMTRkOTc4OWQ2NzE3NTlkZWZlODNkMmU3OWQyNmE5NmM0OGYxOWYyMzQxMTM1MDdlNzMwMmU4YmViMDZmMzE5ZTY3M2NiOSIsImlhdCI6MTc4MDkzMjA1MywibmJmIjoxNzgwOTMyMDUzLCJleHAiOjE4MDE1MjY0MDAsInN1YiI6IjEzMzQ5Mjk1IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0NzMzNzk1LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiN2M5ZGZmZmYtZTcyYS00ZDNjLWI2ZWYtYWQyZTk4MDUwNTJmIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.BeNVLTgiSs9SRNMbRSLBpb-4_Cm7pvQDP_2GeG0ctFSvx-8pknWiw8h3OCbmJDCDNmrPS2IMMGAnRDEpSbHp7AZ39I0qv7n45_loMGuZUeFQl66dNhttcR57W5jkLhH32giF2LZpLsCwsLDBKiTppv2h1OgnasLjw73yak4yjXsaoR8_cxXDYAFCrWBfugy7OVyZ6qkkdyHGv4sGVuUfH4eWHCLcbA458KaScj1HC7Ws5uRl5CN0ofdDtCF1AsEK4qROhVj5l_QgYD2nShYoxUz9JNF931S-yxxLtz0pz7guc5dhbC9JlY_G1lWnUCviDi9KwPK5Y33HhKexz-z3HA"
     ```
   - Standard JWT authentication credentials for Kommo CRM are hardcoded in the HTTP Request node headers instead of being mapped through n8n variables or secrets management.

4. **Insecure and Permissive RLS Policies**  
   - File: `DASHBOARDFinanciero/supabase-setup.sql`, lines 12-40:
     ```sql
     CREATE POLICY "dashboard_read_entradas" ON public.entradas FOR SELECT TO anon, authenticated USING (true);
     CREATE POLICY "dashboard_read_salidas" ON public.salidas FOR SELECT TO anon, authenticated USING (true);
     CREATE POLICY "dashboard_update_clientes" ON public.clientes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
     CREATE POLICY "dashboard_delete_entradas" ON public.entradas FOR DELETE TO anon, authenticated USING (true);
     ```
   - Row Level Security (RLS) is enabled, but the policies grant unauthenticated public access (`TO anon`) to read, update, and delete entries inside the tables, rendering the RLS protection ineffective.

---

## 2. Logic Chain

1. **Vite's Client-Side Asset Bundling**: Vite embeds environment variables prefixed with `VITE_` directly into the generated bundle. 
2. **Key Theft Risk**: If a developer uses a secret role key (such as `VITE_SUPABASE_SECRET_KEY`) or an LLM credit key (such as `VITE_GROQ_API_KEY`) on the client side, anyone accessing the web page can retrieve these keys from browser source inspection.
3. **Database Compromise**: Since `VITE_SUPABASE_SECRET_KEY` bypasses all Row Level Security (RLS) policies, an attacker possessing this key gets administrative read, write, and delete permissions on the database, leading to full data compromise.
4. **Permissive Database Policies**: Even if the client-side code did not expose the secret role key, the public RLS policies on Supabase allow any anonymous client using the public key (`anon`) to read, write, and delete records due to `USING (true)` and `WITH CHECK (true)` declarations.
5. **Credentials Exposure**: Hardcoded Bearer tokens in `n8n-kommo-workflow.json` expose the agency's private CRM APIs.
6. **Unified Test Suite**: To identify these security issues and prevent regressions, the E2E test runner structure can be expanded to include static analysis validation checking these patterns.

---

## 3. Caveats

- **Static Analysis Scope**: The security test suite is designed as a static code and configuration parser (consistent with the project's browser-automation-free test philosophy due to sandbox network restrictions). It does not execute real SQL Injection attacks or run live pen-testing against active endpoints.
- **Environment Assumptions**: The analysis assumes standard Vite compilation behavior where all variables imported via `import.meta.env` are subject to client-side packaging.

---

## 4. Conclusion

We propose the creation of `security.test.js` and `run-security-tests.js` inside the `DASHBOARDOperacional/test/` directory to automatically verify code against credentials exposure, SQL injection vectors, and weak database policy patterns.

### 4.1 Test Harness Structure

#### 1. Security Test runner: `test/run-security-tests.js`
This runner utilizes a Node.js-based test framework matching the console reporting and exit codes of the main UI/UX suite (`run-tests.js`).

```javascript
const { tests } = require('./security.test');

console.log('==================================================');
console.log('      Running Static Security Verification Suite  ');
console.log('==================================================\n');

let passedCount = 0;
let failedCount = 0;
const results = [];

for (const test of tests) {
  try {
    const { pass, message } = test.testFn();
    if (pass) {
      passedCount++;
      results.push({ ...test, pass, message, status: 'PASS' });
      console.log(`[PASS] [Tier ${test.tier}] [Category: ${test.category}] Test #${test.id}: ${test.name}`);
    } else {
      failedCount++;
      results.push({ ...test, pass, message, status: 'FAIL' });
      console.log(`[FAIL] [Tier ${test.tier}] [Category: ${test.category}] Test #${test.id}: ${test.name}`);
      console.log(`       Reason: ${message}`);
    }
  } catch (error) {
    failedCount++;
    results.push({ ...test, pass: false, message: error.message, status: 'ERROR' });
    console.log(`[ERR!] [Tier ${test.tier}] [Category: ${test.category}] Test #${test.id}: ${test.name}`);
    console.log(`       Error: ${error.message}`);
  }
}

console.log('\n==================================================');
console.log('                  Test Summary                    ');
console.log('==================================================');
console.log(`Total Test Cases : ${tests.length}`);
console.log(`Passed           : ${passedCount}`);
console.log(`Failed           : ${failedCount}`);
console.log(`Pass Rate        : ${((passedCount / tests.length) * 100).toFixed(2)}%`);
console.log('==================================================\n');

if (failedCount > 0) {
  console.log('Security verification failed. Please check the credentials and policies above.');
  process.exit(1);
} else {
  console.log('All security checks passed successfully!');
  process.exit(0);
}
```

#### 2. Security Test definitions: `test/security.test.js`
This file implements static analysis of files using regular expressions to detect the vulnerabilities identified.

```javascript
const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../src/App.jsx');
const clientViewPath = path.resolve(__dirname, '../src/components/ClientView.jsx');
const supabaseClientPath = path.resolve(__dirname, '../src/supabaseClient.js');
const aiServicePath = path.resolve(__dirname, '../src/services/aiService.js');
const workflowPath = path.resolve(__dirname, '../n8n-kommo-workflow.json');
const setupSqlPath = path.resolve(__dirname, '../../DASHBOARDFinanciero/supabase-setup.sql');

// Read files securely with fallback empty strings if they don't exist yet
let appContent = '';
let clientViewContent = '';
let supabaseClientContent = '';
let aiServiceContent = '';
let workflowContent = '';
let setupSqlContent = '';

try { appContent = fs.readFileSync(appPath, 'utf8'); } catch (e) {}
try { clientViewContent = fs.readFileSync(clientViewPath, 'utf8'); } catch (e) {}
try { supabaseClientContent = fs.readFileSync(supabaseClientPath, 'utf8'); } catch (e) {}
try { aiServiceContent = fs.readFileSync(aiServicePath, 'utf8'); } catch (e) {}
try { workflowContent = fs.readFileSync(workflowPath, 'utf8'); } catch (e) {}
try { setupSqlContent = fs.readFileSync(setupSqlPath, 'utf8'); } catch (e) {}

const tests = [
  // TIER 1 - Happy Path Static Definitions
  {
    id: 101,
    tier: 1,
    category: "ENV_CONFIG",
    name: "supabaseClient.js imports VITE_SUPABASE_ANON_KEY",
    testFn: () => {
      const match = supabaseClientContent.includes("VITE_SUPABASE_ANON_KEY");
      return { pass: match, message: match ? "Found VITE_SUPABASE_ANON_KEY" : "Missing VITE_SUPABASE_ANON_KEY in supabaseClient.js" };
    }
  },
  {
    id: 102,
    tier: 1,
    category: "DB_ACCESS",
    name: "Database service calls try-catch block for resilience",
    testFn: () => {
      const match = aiServiceContent.includes("try {") && aiServiceContent.includes("catch (err)");
      return { pass: match, message: match ? "Found try-catch query blocks" : "Missing try-catch query blocks in DB calls" };
    }
  },
  
  // TIER 2 - Boundaries and Errors
  {
    id: 103,
    tier: 2,
    category: "ENV_CONFIG",
    name: "supabaseClient.js does not leak VITE_SUPABASE_SECRET_KEY client-side",
    testFn: () => {
      const leaked = supabaseClientContent.includes("VITE_SUPABASE_SECRET_KEY") || supabaseClientContent.includes("service_role");
      return { pass: !leaked, message: !leaked ? "Service role keys not imported client-side" : "Critical leak: VITE_SUPABASE_SECRET_KEY or service role reference detected in client file" };
    }
  },
  {
    id: 104,
    tier: 2,
    category: "CREDENTIALS",
    name: "n8n workflow does not store plain-text DB passwords",
    testFn: () => {
      const hasPlainPassword = workflowContent.includes('"password": "') && !workflowContent.includes('"password": "={{');
      return { pass: !hasPlainPassword, message: !hasPlainPassword ? "No plaintext password fields found" : "Vulnerability: Plaintext password string detected in workflow JSON" };
    }
  },

  // TIER 3 - Cross-Feature Combinations (at least 4 tests)
  {
    id: 105,
    tier: 3,
    category: "CROSS_FEATURE_SEC",
    name: "Cross-Feature: Vite environment credentials vs client bundle leak",
    testFn: () => {
      const usesSecret = supabaseClientContent.includes('VITE_SUPABASE_SECRET_KEY') || aiServiceContent.includes('VITE_GROQ_API_KEY');
      const usesProxyOrSafeKeys = supabaseClientContent.includes('VITE_SUPABASE_ANON_KEY');
      const pass = !usesSecret && usesProxyOrSafeKeys;
      return {
        pass,
        message: pass 
          ? "Front-end uses only public keys; sensitive keys (secret_key, groq_api_key) are excluded from client bundle"
          : "Vulnerability: Private credentials (SECRET_KEY or GROQ_API_KEY) are directly loaded in client scripts"
      };
    }
  },
  {
    id: 106,
    tier: 3,
    category: "CROSS_FEATURE_SEC",
    name: "Cross-Feature: Supabase RLS Policy vs anonymous mutation permissions",
    testFn: () => {
      const permissiveAnonPolicy = /CREATE POLICY.*ON.*FOR\s+(?:UPDATE|DELETE|ALL|INSERT)\s+TO\s+[^;]*anon[^;]*USING\s*\(\s*true\s*\)/i.test(setupSqlContent);
      return {
        pass: !permissiveAnonPolicy,
        message: !permissiveAnonPolicy 
          ? "No permissive write/delete RLS policies granted globally to 'anon' users" 
          : "Vulnerability: Permissive write/delete policy found enabling anon TO USING(true) on database tables"
      };
    }
  },
  {
    id: 107,
    tier: 3,
    category: "CROSS_FEATURE_SEC",
    name: "Cross-Feature: AI tool calling arguments vs parameterized SQL mapping",
    testFn: () => {
      const rawSqlInterp = /from\(\s*['"]\w+['"]\s*\)[\s\S]*select[\s\S]*\$\{/.test(aiServiceContent);
      const usesSafeBuilders = aiServiceContent.includes(".ilike(") || aiServiceContent.includes(".eq(");
      const pass = !rawSqlInterp && usesSafeBuilders;
      return {
        pass,
        message: pass 
          ? "AI helper database functions utilize safe parameterized postgREST filter methods"
          : "Vulnerability: Dynamic string interpolation detected inside database query selection filters"
      };
    }
  },
  {
    id: 108,
    tier: 3,
    category: "CROSS_FEATURE_SEC",
    name: "Cross-Feature: n8n workflow authentication vs REST API tokenization",
    testFn: () => {
      const hasWorkflowWebhookAuth = workflowContent.includes('"authentication":') || workflowContent.includes('"authType":');
      const hasHardcodedBearer = /"value":\s*"Bearer\s+eyJ/i.test(workflowContent);
      const pass = hasWorkflowWebhookAuth && !hasHardcodedBearer;
      return {
        pass,
        message: pass 
          ? "n8n HTTP connections use credentials references instead of hardcoded bearer token strings"
          : "Vulnerability: Webhook configuration is unauthenticated or leaks private JWT authorization headers"
      };
    }
  },

  // TIER 4 - Real-world Scenarios (at least 5 tests)
  {
    id: 109,
    tier: 4,
    category: "REAL_WORLD_SEC",
    name: "Real-world: Client-side source key validation for Groq API proxy",
    testFn: () => {
      const usesGroqKeyClientSide = aiServiceContent.includes("Bearer ${getApiKey()}") || aiServiceContent.includes("VITE_GROQ_API_KEY");
      const pass = !usesGroqKeyClientSide; // Safe configuration passes LLM tasks through backend gateway proxy
      return {
        pass,
        message: pass 
          ? "Direct client-side third-party LLM API endpoint invocations are absent" 
          : "Vulnerability: Client scripts send VITE_GROQ_API_KEY directly to api.groq.com; key is exposed to browser"
      };
    }
  },
  {
    id: 110,
    tier: 4,
    category: "REAL_WORLD_SEC",
    name: "Real-world: SQL Injection payload sanitization in database queries",
    testFn: () => {
      const trimOrSanitized = aiServiceContent.includes(".replace") || aiServiceContent.includes("trim()") || /if\s*\(!name\s*\|\|\s*name\.trim\(\)\.length\s*===\s*0\)/.test(aiServiceContent);
      return {
        pass: trimOrSanitized,
        message: trimOrSanitized ? "Inputs are validated or trimmed before passing to database builders" : "Vulnerability: Database query inputs are not validated or sanitized"
      };
    }
  },
  {
    id: 111,
    tier: 4,
    category: "REAL_WORLD_SEC",
    name: "Real-world: n8n pipeline token leak mitigation check",
    testFn: () => {
      const jwtMatch = /Bearer\s+eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i.test(workflowContent);
      return {
        pass: !jwtMatch,
        message: !jwtMatch 
          ? "No hardcoded long-lived JWT bearer tokens present in n8n-kommo-workflow.json" 
          : "Vulnerability: Hardcoded bearer token leak detected in workflow json file"
      };
    }
  },
  {
    id: 112,
    tier: 4,
    category: "REAL_WORLD_SEC",
    name: "Real-world: AI prompt jailbreak mitigation and context limits",
    testFn: () => {
      const promptConstraint = aiServiceContent.includes("Bajo NINGUNA circunstancia responderás preguntas generales") ||
                                aiServiceContent.includes("SOLO puedes hablar sobre los clientes");
      return {
        pass: promptConstraint,
        message: promptConstraint 
          ? "AI service contains explicit system instructions guarding against jailbreaks and scope escapes" 
          : "Security Warning: AI assistant prompt does not enforce strict system constraints to reject general conversation"
      };
    }
  },
  {
    id: 113,
    tier: 4,
    category: "REAL_WORLD_SEC",
    name: "Real-world: SQL Setup restricts anon access to sensitive auditing tables",
    testFn: () => {
      const hasAnonSelectOnHistorial = /GRANT\s+SELECT\s+ON\s+(?:public\.)?historial_cambios\s+TO\s+[^;]*anon/i.test(setupSqlContent);
      const hasAnonSelectOnChats = /GRANT\s+SELECT\s+ON\s+(?:public\.)?ai_chats\s+TO\s+[^;]*anon/i.test(setupSqlContent);
      const pass = !hasAnonSelectOnHistorial && !hasAnonSelectOnChats;
      return {
        pass,
        message: pass 
          ? "Access to auditing logs and personal chat logs is restricted to authenticated roles only" 
          : "Vulnerability: SQL setup grants database SELECT permission to anon on sensitive auditing tables (historial_cambios, ai_chats)"
      };
    }
  }
];

module.exports = { tests };
```

---

## 5. Verification Method

### 5.1 Command to run Security Suite
To execute the security tests:
```bash
node DASHBOARDOperacional/test/run-security-tests.js
```

### 5.2 Command to run all suites
We recommend adding the following script helper to `package.json` to allow running both UI/UX E2E tests and security static analysis tests sequentially:
```json
"scripts": {
  "test": "node test/run-tests.js && node test/run-security-tests.js"
}
```
Command to run:
```bash
npm test
```

### 5.3 Invalidation Conditions
- The tests are expected to **FAIL** on the current codebase due to the presence of:
  - `VITE_SUPABASE_SECRET_KEY` in `src/supabaseClient.js`
  - Client-side fetch headers using API Key in `src/services/aiService.js`
  - Hardcoded JWT Bearer authorization token in `n8n-kommo-workflow.json`
  - `TO anon` permissive database policies in `supabase-setup.sql`
- The tests will **PASS** once:
  - `VITE_SUPABASE_SECRET_KEY` is removed from the client code and replaced by `VITE_SUPABASE_ANON_KEY`.
  - The Groq API key is proxied through a secure backend server instead of direct browser fetches.
  - The n8n credentials are saved as environment parameters/secret vault connections instead of plain text tokens.
  - The SQL setup is corrected to restrict RLS write/delete policies and sensitive grants to `authenticated` users only.
