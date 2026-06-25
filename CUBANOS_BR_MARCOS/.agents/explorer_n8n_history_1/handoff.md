# Codebase Discovery & Analysis Handoff Report

## 1. Observation
We examined several files to locate mappings, database schemas, and global AI chat contexts. 

### Key Locations and Observations:
1. **n8n Workflow File**: `DASHBOARDOperacional/n8n-kommo-workflow.json` (and duplicate `workflow/principal`):
   - **Incorrect JSON references**: In node `"Actualizar Cliente"` (lines 159, 163, 167), it uses `.data[0]` to reference row properties from the previous lookup query:
     - `recurrencia`: `"={{ ($input.first().json.data[0].recurrencia || 1) + 1 }}"`
     - `valor_total`: `"={{ ($('Buscar Cliente en BD').item.json.data[0].valor_total || 0) + $('Mapear Datos Completos').item.json.valor_total }}"`
     - `cantidad_tramites`: `"={{ ($('Buscar Cliente en BD').item.json.data[0].cantidad_tramites || 0) + 1 }}"`
     However, the output of the Supabase node `"Buscar Cliente en BD"` does not wrap results in a `data` key; the row properties are accessible directly on `json` (as seen in the **If** node at line 394: `leftValue: "={{ $('Buscar Cliente en BD').first().json.id_kommo }}"`).
   - **Hardcoded CPF**: Both `"Crear Cliente"` (line 209) and `"Insertar Entrada"` (line 341) hardcode the `cpf` field:
     - `"fieldId": "cpf", "fieldValue": "1"`
     This causes incorrect data insertion and will cause unique key constraint violations if real client records have CPFs, or if CPF is unique.
   - **Discrepancy in spelling**: Node `"Crear Cliente"` maps `"recurrencia"`, whereas `"Insertar Entrada"` maps `"recorrencia"`. 
   - **Missing `estado` mapping for `entradas`**: The `"Insertar Entrada"` Supabase mapping (lines 296-366) does not map `estado` (the UF field), and `"Preparar Entrada"` does not pass `estado` (the UF), though it is present in the `entradas` table schema.

2. **Global AI Chat files**:
   - `DASHBOARDOperacional/src/context/GlobalAiChatContext.jsx` manages global chat message states using `sendMessage` (line 25). It calls `chatWithTools` from `src/services/aiService.js`.
   - Currently, it has no import of `supabase`, nor does it attempt to persist messages to the database.
   - `DASHBOARDOperacional/src/App.jsx` handles `selectedClientId` as a state (line 12), but it is not passed down as a prop to `<GlobalAiChatProvider>` (line 49) or `<GlobalAiChat />` (line 160).
   - `DASHBOARDOperacional/src/components/ClientView.jsx` is the only other place where `ai_chats` is queried or saved:
     - Loads history (line 528): `await supabase.from('ai_chats').select('*').eq('cliente_id', client.id)...`
     - Inserts user message (line 556): `supabase.from('ai_chats').insert({ cliente_id: client.id, role: 'user', content: userMsg }).then();`
     - Inserts assistant message (line 576): `supabase.from('ai_chats').insert({ cliente_id: client.id, role: 'assistant', content: response }).then();`

---

## 2. Logic Chain
1. **JSON reference failure**: If a node attempts to read `.data[0].valor_total` when the object is directly `{ valor_total: X }`, the expression evaluates to `undefined`. Thus:
   - `recurrencia` updates incorrectly (evaluates to `NaN` or resets).
   - `valor_total` evaluates to `0 + new_lead_budget = new_lead_budget`, overwriting and wiping out the historical total value in the database.
   - `cantidad_tramites` resets to `1`.
2. **CPF failure**: Hardcoding `cpf` to `"1"` prevents real CPF collection and will fail database unique index constraints if they exist. CPF should be extracted from contact custom fields in `"Mapear Datos Completos"`.
3. **Spelling conflict**: The database table `entradas` has column `recorrencia` (text), and `clientes` uses `recurrencia` (integer). Mappings should align.
4. **Context availability**: Since `App.jsx` already stores `selectedClientId`, passing it to `GlobalAiChatProvider` will give the global chat context access to the active client ID.
5. **Auto-saving and loading in global chat**: By utilizing the newly shared `selectedClientId` in `GlobalAiChatContext.jsx`, we can load the existing `ai_chats` conversation history on client change and automatically insert new user/assistant messages to Supabase when the chat is active on `ClientView`.

---

## 3. Caveats
- We assumed the `ai_chats` table has `cliente_id`, `role`, `content`, and `creado_en` columns (which matches the queries and inserts in `ClientView.jsx`).
- We assumed the `selectedClientId` should only tie global chat messages to a client if `currentView === 'client'`. If the user is on the main Dashboard view, the `selectedClientId` is set to `null` so messages will not be persisted.

---

## 4. Conclusion
We recommend:
1. Updating `n8n-kommo-workflow.json` to extract/map CPF, map the `estado` column, correct `.data[0]` references, and align spelling.
2. Updating `App.jsx` to pass `selectedClientId` to `<GlobalAiChatProvider>`.
3. Updating `GlobalAiChatContext.jsx` to load history when `selectedClientId` changes, and persist both user messages and assistant responses to the `ai_chats` table in Supabase.

---

## 5. Verification Method

### Mappings Verification:
1. **n8n Mappings**:
   - Inspect `n8n-kommo-workflow.json` to verify that `data[0]` is removed and fields refer directly to `$input.first().json` or `$('Buscar Cliente en BD').first().json`.
   - Verify `cpf` is mapped to `{{ $('Mapear Datos Completos').first().json.cpf }}`.
   - Verify `estado` is added to `Insertar Entrada` with value `{{ $json.estado }}`.

### AI Chat Persistence Verification:
1. Open the operational dashboard.
2. Select a client to enter the `ClientView`.
3. Click the Global AI Chat floating action button.
4. Send a message to the assistant (e.g., asking for client details).
5. Verify in the Supabase SQL editor or logs that:
   - The user query is saved to `ai_chats` with the correct `cliente_id`.
   - The assistant response is saved to `ai_chats` with the correct `cliente_id`.
   - Refreshing the page and returning to the client retains the chat history in both the client-specific chat and the Global AI Chat.

---

## Proposed Code Modifications

### 1. Mappings (n8n-kommo-workflow.json)

**Extracting CPF and state in "Mapear Datos Completos" node:**
```javascript
// Add inside the JS code of Mapear Datos Completos:
const cpfCampo = camposContacto.find(f => f.field_name?.toLowerCase().includes('cpf')) ||
                 camposLead.find(f => f.field_name?.toLowerCase().includes('cpf'));
const cpfValor = cpfCampo?.values?.[0]?.value || '';

// Add to returned json object:
return [{ json: {
  ...
  cpf: cpfValor,
  estado_federal: getField(camposLead, 'estado'),
  ...
}}];
```

**Passing state in "Preparar Entrada" node:**
```javascript
// Add to the return json object:
return [{ json: {
  ...
  cpf: datos.cpf,
  estado: datos.estado_federal,
  ...
}}];
```

**Correcting expressions in "Actualizar Cliente":**
```json
// recurrencia
"fieldValue": "={{ ($input.first().json.recurrencia || 0) + 1 }}"

// valor_total
"fieldValue": "={{ ($('Buscar Cliente en BD').first().json.valor_total || 0) + $('Mapear Datos Completos').first().json.valor_total }}"

// cantidad_tramites
"fieldValue": "={{ ($('Buscar Cliente en BD').first().json.cantidad_tramites || 0) + 1 }}"
```

---

### 2. App.jsx (src/App.jsx)
Change:
```jsx
// Line 49
    <GlobalAiChatProvider selectedClientId={currentView === 'client' ? selectedClientId : null}>
```

---

### 3. GlobalAiChatContext.jsx (src/context/GlobalAiChatContext.jsx)
Change to:
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatWithTools } from '../services/aiService';
import { supabase } from '../supabaseClient';

export const GlobalAiChatContext = createContext(null);

export const GlobalAiChatProvider = ({ children, selectedClientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de IA global. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  // Load chat history from Supabase when selectedClientId changes
  useEffect(() => {
    if (selectedClientId) {
      const loadHistory = async () => {
        try {
          const { data, error } = await supabase
            .from('ai_chats')
            .select('*')
            .eq('cliente_id', selectedClientId)
            .order('creado_en', { ascending: true });
          
          if (data && !error) {
            setMessages(data.length > 0 ? data.map(d => ({ role: d.role, content: d.content })) : [
              { role: 'assistant', content: `¡Hola! Soy tu asistente de IA global. ¿En qué te puedo ayudar hoy?` }
            ]);
          }
        } catch (err) {
          console.error("Error loading chat history from Supabase:", err);
        }
      };
      loadHistory();
    } else {
      setMessages([
        { role: 'assistant', content: '¡Hola! Soy tu asistente de IA global. ¿En qué te puedo ayudar hoy?' }
      ]);
    }
  }, [selectedClientId]);

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: '¡Hola! Soy tu asistente de IA global. ¿En qué te puedo ayudar hoy?' }
    ]);
  };

  const clearHistory = clearChat;

  const sendMessage = async (text) => {
    if (!text || !text.trim()) {
      return;
    }

    const trimmedText = text.trim();
    const userMessage = { role: 'user', content: trimmedText };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setIsLoading(true);

    // Save user message to Supabase
    if (selectedClientId) {
      supabase
        .from('ai_chats')
        .insert({ cliente_id: selectedClientId, role: 'user', content: trimmedText })
        .then();
    }

    try {
      const reply = await chatWithTools(updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      
      // Save assistant message to Supabase
      if (selectedClientId) {
        supabase
          .from('ai_chats')
          .insert({ cliente_id: selectedClientId, role: 'assistant', content: reply })
          .then();
      }
    } catch (error) {
      console.error("Error in Global AI Chat sendMessage:", error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, ha ocurrido un error al procesar tu solicitud.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (msg) => {
    if (!msg || !msg.content || !msg.content.trim()) return;
    setMessages(prev => [...prev, msg]);
  };

  return (
    <GlobalAiChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        input,
        setInput,
        sendMessage,
        clearChat,
        clearHistory,
        addMessage
      }}
    >
      {children}
    </GlobalAiChatContext.Provider>
  );
};

export const useGlobalAiChat = () => {
  const context = useContext(GlobalAiChatContext);
  if (!context) {
    throw new Error('useGlobalAiChat must be used within a GlobalAiChatProvider');
  }
  return context;
};
```
