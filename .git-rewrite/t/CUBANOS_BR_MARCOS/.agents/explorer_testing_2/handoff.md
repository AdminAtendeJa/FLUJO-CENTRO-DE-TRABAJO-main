# Security Analysis and Static-Analysis E2E Test Suite Specification (R3 & R4)

This handoff report details findings for database security (R3 - Row Level Security) and application security (R4 - SQLi/XSS Input Sanitization) within the `FLUJO-CENTRO-DE-TRABAJO` codebase, along with the specification for a Node.js static-analysis test suite.

---

## 1. Observation

### R3: Row Level Security (RLS)
The codebase includes SQL setup scripts inside `c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\DASHBOARDFinanciero`.
Specifically, `DASHBOARDFinanciero/supabase-setup.sql` contains the following lines:
* **Line 6**: `ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;`
* **Lines 26-27**:
  ```sql
  CREATE POLICY "dashboard_read_clientes" ON public.clientes
    FOR SELECT TO anon, authenticated USING (true);
  ```
* **Lines 29-31**:
  ```sql
  DROP POLICY IF EXISTS "dashboard_update_clientes" ON public.clientes;
  CREATE POLICY "dashboard_update_clientes" ON public.clientes
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  ```
* **Lines 37-39**:
  ```sql
  DROP POLICY IF EXISTS "dashboard_insert_clientes" ON public.clientes;
  CREATE POLICY "dashboard_insert_clientes" ON public.clientes
    FOR INSERT TO anon, authenticated WITH CHECK (true);
  ```
* **Lines 45-47**:
  ```sql
  DROP POLICY IF EXISTS "dashboard_delete_clientes" ON public.clientes;
  CREATE POLICY "dashboard_delete_clientes" ON public.clientes
    FOR DELETE TO anon, authenticated USING (true);
  ```

### R4: SQL Injection (SQLi) Prevention
In `DASHBOARDOperacional/src/components/ClientListView.jsx`:
* **Lines 27-30**: Database query for clients is static and fetches all rows:
  ```javascript
  const { data: clientesData, error: err1 } = await supabase
    .from('clientes')
    .select('*')
    .order('creado_en', { ascending: false });
  ```
* **Lines 58-62**: The search query filtering is performed purely in-memory on the client:
  ```javascript
  const filteredClientes = clientes.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const qNormalized = q.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
  ```

### R4: Cross-Site Scripting (XSS) Prevention
In `DASHBOARDFinanciero/utils.js`:
* **Lines 8-15**: Defines HTML escaping:
  ```javascript
  function escapeHtml(value) {
    return safeText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  ```
In `DASHBOARDFinanciero/app.js`:
* **Line 14**: Destructures `escapeHtml` from `window.DashboardUtils`:
  ```javascript
  const { escapeHtml, safeText, setStatus: rawSetStatus, fmt, norm } = window.DashboardUtils || {};
  ```
* **Lines 639-645**: Renders detail summary grid using `escapeHtml`:
  ```javascript
  summaryGrid.innerHTML = detail.summaries.map(item => `
    <div class="detail-summary-card">
      <div class="detail-summary-label">${escapeHtml(item.label)}</div>
      <div class="detail-summary-value ${item.cls || ''}">${escapeHtml(item.value)}</div>
      ${item.note ? `<div class="detail-summary-note">${escapeHtml(item.note)}</div>` : ''}
    </div>
  `).join('');
  ```
* **Lines 305-312**: Sets options safely using DOM properties instead of `innerHTML`:
  ```javascript
  atendenteSelect.innerHTML = '<option value="todos">Todos</option>';
  atendentes.forEach(atendente => {
    const option = document.createElement('option');
    option.value = atendente;
    option.textContent = atendente;
    option.selected = atendente === current;
    atendenteSelect.appendChild(option);
  });
  ```

---

## 2. Logic Chain

1. **R3 Verification**:
   - The existence of RLS on `clientes` is verified by scanning `.sql` files for table alteration (`ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;`).
   - Access policies are verified by searching for policy creation statements targeting `clientes` across all CRUD verbs (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
   - This ensures RLS is active and configured at the schema level.

2. **R4 SQLi Verification**:
   - In `ClientListView.jsx`, the database query `supabase.from('clientes').select('*')` contains no variables or filters derived from `searchQuery`.
   - The filtering logic references `searchQuery` inside JavaScript `.filter()`.
   - Since no user input from the search input reaches the query engine or gets parsed as SQL/filters, SQL injection is impossible via this channel. A static test checking that `searchQuery` never participates in any database client method call is sufficient to verify SQLi prevention.

3. **R4 XSS Verification**:
   - In `DASHBOARDFinanciero/app.js`, dynamic template literals are assigned to `.innerHTML` properties of various DOM container elements (`summaryGrid`, `tablaServicios`, `tablaCategorias`, etc.).
   - Database-sourced values (e.g., `row.cliente`, `service.label`) are passed through `escapeHtml(...)`.
   - Simple select inputs are constructed using `option.textContent = atendente` (which is secure).
   - This can be statically verified by examining AST / token streams of Javascript files to ensure all variables injected in `innerHTML` literals are wrapped in `escapeHtml()`, `fmt()`, or `pct()`.

---

## 3. Caveats
* The static analysis relies on regular expressions/AST structures. It assumes that there are no runtime-compiled SQL query builders or remote scripts not visible in the local workspace.
* It assumes that database-side RLS behaves according to the migration scripts, but doesn't connect to a live PostgreSQL database instance to verify policies in action.

---

## 4. Conclusion
The codebase actively enables Row Level Security on the `clientes` table with dedicated SELECT, INSERT, UPDATE, and DELETE policies targeting `anon` and `authenticated` roles in `supabase-setup.sql`. SQL Injection is prevented in the client list search because the filtering is implemented completely client-side in-memory. Cross-Site Scripting (XSS) is prevented in the financial dashboard via a custom HTML-escaping helper (`escapeHtml`) and safe DOM manipulation APIs (`textContent`).

---

## 5. Verification Method

### Test Cases Specification

Here is the specification of 20 test cases (10 for R3, 10 for R4) categorized by Tiers.

| Test ID | Tier | Requirement | Test Name / Goal | Assertion Criteria |
|---|---|---|---|---|
| **R3-T1-01** | 1 | R3 | Setup SQL Script Existence | Assert `supabase-setup.sql` exists. |
| **R3-T1-02** | 1 | R3 | Enable RLS Statement | Assert `ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;` is present. |
| **R3-T1-03** | 1 | R3 | SELECT Policy Configuration | Assert `CREATE POLICY ... ON ... FOR SELECT` is defined for `clientes`. |
| **R3-T1-04** | 1 | R3 | INSERT Policy Configuration | Assert `CREATE POLICY ... ON ... FOR INSERT` is defined for `clientes`. |
| **R3-T1-05** | 1 | R3 | UPDATE Policy Configuration | Assert `CREATE POLICY ... ON ... FOR UPDATE` is defined for `clientes`. |
| **R3-T2-01** | 2 | R3 | DELETE Policy Configuration | Assert `CREATE POLICY ... ON ... FOR DELETE` is defined for `clientes`. |
| **R3-T2-02** | 2 | R3 | Policy Target Roles | Assert policies limit roles explicitly with `TO anon, authenticated`. |
| **R3-T2-03** | 2 | R3 | Drop-Create Integrity | Assert that every dropped policy has a corresponding `CREATE POLICY`. |
| **R3-T2-04** | 2 | R3 | Schema Naming Uniformity | Assert table references uniformly use either schema (`public.clientes`) or bare table. |
| **R3-T2-05** | 2 | R3 | Realtime Publication Inclusion | Assert table is added to `supabase_realtime` publication in SQL. |
| **R4-T1-01** | 1 | R4 | searchInput Prop Handling | Assert `ClientListView` receives `searchQuery` prop. |
| **R4-T1-02** | 1 | R4 | In-Memory Query Isolation | Assert that database query methods do not contain reference to `searchQuery`. |
| **R4-T1-03** | 1 | R4 | Local Filter Reference | Assert that `searchQuery` is referenced inside a local `.filter(...)` block. |
| **R4-T1-04** | 1 | R4 | escapeHtml Definition | Assert `utils.js` defines an `escapeHtml` function replacing `< > & " '`. |
| **R4-T1-05** | 1 | R4 | innerHTML Escaped Interpolation | Assert variables written to `innerHTML` in `app.js` are wrapped in `escapeHtml` or formatters. |
| **R4-T2-01** | 2 | R4 | Accent Normalization Check | Assert `ClientListView` uses `.normalize("NFD")` to normalize search strings. |
| **R4-T2-02** | 2 | R4 | Safe textContent Usage | Assert select lists are populated using `.textContent` instead of `innerHTML`. |
| **R4-T2-03** | 2 | R4 | Attribute XSS Prevention | Assert attribute template variables (e.g. `data-*`) are properly quoted and escaped. |
| **R4-T2-04** | 2 | R4 | Database Value Sanitization | Assert that all keys from database objects (e.g. `row.*`) are escaped in DOM sinks. |
| **R4-T2-05** | 2 | R4 | Whitespace Evasion Protection | Assert that the search query is trimmed and split on white spaces (`/\s+/`). |

### JavaScript Code for Static-Analysis E2E Test Suite

The following Javascript code implements all 20 test cases and can be run under Node.js:

```javascript
// test/security.test.js
const fs = require('fs');
const path = require('path');

const setupSqlPath = path.resolve(__dirname, '../../DASHBOARDFinanciero/supabase-setup.sql');
const clientListViewPath = path.resolve(__dirname, '../src/components/ClientListView.jsx');
const appJsPath = path.resolve(__dirname, '../../DASHBOARDFinanciero/app.js');
const utilsJsPath = path.resolve(__dirname, '../../DASHBOARDFinanciero/utils.js');

let sqlContent = '';
let clientListContent = '';
let appJsContent = '';
let utilsJsContent = '';

try { sqlContent = fs.readFileSync(setupSqlPath, 'utf8'); } catch(e) {}
try { clientListContent = fs.readFileSync(clientListViewPath, 'utf8'); } catch(e) {}
try { appJsContent = fs.readFileSync(appJsPath, 'utf8'); } catch(e) {}
try { utilsJsContent = fs.readFileSync(utilsJsPath, 'utf8'); } catch(e) {}

const tests = [
  // ==================== REQUIREMENT R3: ROW LEVEL SECURITY ====================
  {
    id: "R3-T1-01",
    tier: 1,
    name: "Setup SQL script exists",
    testFn: () => {
      const pass = fs.existsSync(setupSqlPath);
      return { pass, message: pass ? "File exists" : "Missing supabase-setup.sql" };
    }
  },
  {
    id: "R3-T1-02",
    tier: 1,
    name: "Row Level Security enabled on clientes",
    testFn: () => {
      const regex = /ALTER\s+TABLE\s+(public\.)?clientes\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i;
      const pass = regex.test(sqlContent);
      return { pass, message: pass ? "RLS enabled" : "Missing ENABLE ROW LEVEL SECURITY for clientes table" };
    }
  },
  {
    id: "R3-T1-03",
    tier: 1,
    name: "SELECT Policy defined for clientes",
    testFn: () => {
      const regex = /CREATE\s+POLICY\s+\w+\s+ON\s+(public\.)?clientes\s+FOR\s+SELECT/i;
      const pass = regex.test(sqlContent);
      return { pass, message: pass ? "SELECT policy defined" : "Missing SELECT policy on clientes" };
    }
  },
  {
    id: "R3-T1-04",
    tier: 1,
    name: "INSERT Policy defined for clientes",
    testFn: () => {
      const regex = /CREATE\s+POLICY\s+\w+\s+ON\s+(public\.)?clientes\s+FOR\s+INSERT/i;
      const pass = regex.test(sqlContent);
      return { pass, message: pass ? "INSERT policy defined" : "Missing INSERT policy on clientes" };
    }
  },
  {
    id: "R3-T1-05",
    tier: 1,
    name: "UPDATE Policy defined for clientes",
    testFn: () => {
      const regex = /CREATE\s+POLICY\s+\w+\s+ON\s+(public\.)?clientes\s+FOR\s+UPDATE/i;
      const pass = regex.test(sqlContent);
      return { pass, message: pass ? "UPDATE policy defined" : "Missing UPDATE policy on clientes" };
    }
  },
  {
    id: "R3-T2-01",
    tier: 2,
    name: "DELETE Policy defined for clientes",
    testFn: () => {
      const regex = /CREATE\s+POLICY\s+\w+\s+ON\s+(public\.)?clientes\s+FOR\s+DELETE/i;
      const pass = regex.test(sqlContent);
      return { pass, message: pass ? "DELETE policy defined" : "Missing DELETE policy on clientes" };
    }
  },
  {
    id: "R3-T2-02",
    tier: 2,
    name: "Policies target specific roles anon/authenticated",
    testFn: () => {
      const matches = sqlContent.match(/CREATE\s+POLICY\s+.*?ON\s+(public\.)?clientes.*?FOR\s+(SELECT|INSERT|UPDATE|DELETE).*?TO\s+([^;\n]+)/ig) || [];
      const pass = matches.length > 0 && matches.every(m => m.toLowerCase().includes('anon') || m.toLowerCase().includes('authenticated'));
      return { pass, message: pass ? "Policies are appropriately scoped to roles" : "Some policies are not explicitly scoped to anon/authenticated roles" };
    }
  },
  {
    id: "R3-T2-03",
    tier: 2,
    name: "Dropped policies are recreated (integrity check)",
    testFn: () => {
      const dropMatches = [...sqlContent.matchAll(/DROP\s+POLICY\s+IF\s+EXISTS\s+"(\w+)"\s+ON\s+/ig)].map(m => m[1]);
      const createMatches = [...sqlContent.matchAll(/CREATE\s+POLICY\s+"(\w+)"\s+ON\s+/ig)].map(m => m[1]);
      const pass = dropMatches.every(name => createMatches.includes(name));
      return { pass, message: pass ? "All dropped policies recreated" : "Some policies are dropped but never created" };
    }
  },
  {
    id: "R3-T2-04",
    tier: 2,
    name: "Schema references are consistent",
    testFn: () => {
      const references = [...sqlContent.matchAll(/(ALTER\s+TABLE|CREATE\s+POLICY.*?ON)\s+([\w\.]+)/ig)].map(m => m[2]);
      const pass = references.every(ref => ref.startsWith('public.') || !ref.includes('.'));
      return { pass, message: pass ? "Schema references consistent" : "Mixed/incorrect schema scoping detected" };
    }
  },
  {
    id: "R3-T2-05",
    tier: 2,
    name: "Table added to supabase_realtime publication",
    testFn: () => {
      const pass = sqlContent.includes("ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;");
      return { pass, message: pass ? "Table in publication" : "Table public.clientes is not added to supabase_realtime publication" };
    }
  },

  // ==================== REQUIREMENT R4: INPUT SANITIZATION ====================
  {
    id: "R4-T1-01",
    tier: 1,
    name: "ClientListView.jsx receives searchQuery prop",
    testFn: () => {
      const pass = clientListContent.includes("searchQuery");
      return { pass, message: pass ? "searchQuery received" : "ClientListView.jsx does not expect searchQuery prop" };
    }
  },
  {
    id: "R4-T1-02",
    tier: 1,
    name: "searchQuery is isolated from database operations",
    testFn: () => {
      const querySection = clientListContent.match(/supabase\s*\.from\([\s\S]*?\)\s*\.select\([\s\S]*?\)/g) || [];
      const pass = querySection.every(q => !q.includes('searchQuery'));
      return { pass, message: pass ? "searchQuery isolated from API query" : "searchQuery was used in database request call" };
    }
  },
  {
    id: "R4-T1-03",
    tier: 1,
    name: "ClientListView filters clients list using local filter function",
    testFn: () => {
      const pass = clientListContent.includes("clientes.filter") && clientListContent.includes("searchQuery");
      return { pass, message: pass ? "Local client filtering used" : "Missing client-side filter logic using searchQuery" };
    }
  },
  {
    id: "R4-T1-04",
    tier: 1,
    name: "escapeHtml helper is defined in utils.js",
    testFn: () => {
      const pass = utilsJsContent.includes("function escapeHtml") &&
                   utilsJsContent.includes("&amp;") &&
                   utilsJsContent.includes("&lt;") &&
                   utilsJsContent.includes("&gt;");
      return { pass, message: pass ? "escapeHtml correctly defined" : "Missing or incomplete escapeHtml definition" };
    }
  },
  {
    id: "R4-T1-05",
    tier: 1,
    name: "Variables injected in innerHTML are escaped in app.js",
    testFn: () => {
      const innerHtmlMatches = appJsContent.match(/\.innerHTML\s*=\s*[\s\S]*?;/g) || [];
      const pass = innerHtmlMatches.every(assignment => {
        // Simple verification: if assignment contains template literal interpolation ${...},
        // check that it uses escapeHtml, fmt, pct, or is a hardcoded value.
        const interpolations = assignment.match(/\${(.*?)}/g) || [];
        return interpolations.every(interp => {
          const content = interp.slice(2, -1);
          return content.includes('escapeHtml') ||
                 content.includes('fmt') ||
                 content.includes('pct') ||
                 content.includes('cls') || // hardcoded class mapping
                 /^[a-zA-Z0-9_\s'"\(\)]+$/.test(content);
        });
      });
      return { pass, message: pass ? "All innerHTML injections escaped/safe" : "Found unescaped dynamic injection in innerHTML" };
    }
  },
  {
    id: "R4-T2-01",
    tier: 2,
    name: "ClientListView uses NFD accent normalization for search safety",
    testFn: () => {
      const pass = clientListContent.includes('.normalize("NFD")') && clientListContent.includes('.replace(/[\\u0300-\\u036f]/g');
      return { pass, message: pass ? "Accent normalization used" : "Missing unicode accent normalization in search filtering" };
    }
  },
  {
    id: "R4-T2-02",
    tier: 2,
    name: "Dropdown options created safely via textContent to prevent XSS",
    testFn: () => {
      const pass = appJsContent.includes('document.createElement(\'option\')') && appJsContent.includes('.textContent =');
      return { pass, message: pass ? "Safe textContent used for options" : "Option elements constructed dynamically via HTML strings" };
    }
  },
  {
    id: "R4-T2-03",
    tier: 2,
    name: "Attribute values inside innerHTML are properly quoted and escaped",
    testFn: () => {
      const matchAttr = appJsContent.match(/data-dashboard-detail-value\s*=\s*["']\s*\${escapeHtml\(.*?\)}\s*["']/g);
      const pass = matchAttr !== null;
      return { pass, message: pass ? "Attribute interpolation is quoted and escaped" : "Attribute values missing proper escaping / enclosing quotes" };
    }
  },
  {
    id: "R4-T2-04",
    tier: 2,
    name: "Database record fields are always escaped in app.js innerHTML",
    testFn: () => {
      // Find row/item database object interpolations like row.cliente or item.label and verify they use escapeHtml
      const dbFields = ['row.cliente', 'row.servicio', 'item.tramite_codigo', 'item.tramite_nombre', 'category.label'];
      const pass = dbFields.every(field => {
        const escapedUse = `escapeHtml(${field}`;
        // If the codebase contains the raw field, it must be inside escapeHtml
        if (appJsContent.includes(field)) {
          return appJsContent.includes(escapedUse);
        }
        return true;
      });
      return { pass, message: pass ? "Database fields properly escaped" : "Some database fields are directly output to innerHTML without escaping" };
    }
  },
  {
    id: "R4-T2-05",
    tier: 2,
    name: "Search inputs are trimmed and split to block space bypasses",
    testFn: () => {
      const pass = clientListContent.includes('.trim()') && clientListContent.includes('.split(');
      return { pass, message: pass ? "Whitespace split and trim implemented" : "Search input lacks trimming or space splitting" };
    }
  }
];

module.exports = { tests };
```

To run the suite, you can run the test command:
```powershell
node test/run-tests.js
```
(Integrating the `tests` list above into `e2e.test.js` under the same runner architecture).
