# BRIEFING — 2026-06-25T15:06:26Z

## Mission
Analyze n8n workflows and AI chat context/messaging logic for cliente_id and database integration.

## 🔒 My Identity
- Archetype: Explorer
- Roles: explorer_1
- Working directory: c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\.agents\explorer_n8n_history_1
- Original parent: eb1ed698-c66d-400c-a168-2ea75e95763c
- Milestone: codebase discovery

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Analyze n8n mappings for clientes and entradas
- Analyze aiService.js and GlobalAiChatContext.jsx for chat persistence
- Check client context availability in AI chat
- Locate other ai_chats queries/inserts

## Current Parent
- Conversation ID: eb1ed698-c66d-400c-a168-2ea75e95763c
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `DASHBOARDOperacional/n8n-kommo-workflow.json`
  - `workflow/principal`
  - `DASHBOARDOperacional/src/App.jsx`
  - `DASHBOARDOperacional/src/context/GlobalAiChatContext.jsx`
  - `DASHBOARDOperacional/src/components/GlobalAiChat.jsx`
  - `DASHBOARDOperacional/src/components/ClientView.jsx`
  - `DASHBOARDOperacional/src/services/aiService.js`
  - `DASHBOARDFinanciero/supabase-setup.sql`
  - `DASHBOARDFinanciero/supabase-tramites.sql`
  - `DASHBOARDFinanciero/supabase-views.sql`
  - `DASHBOARDFinanciero/app.js`
  - `DASHBOARDFinanciero/entradas.js`
  - `TABLAS/clientes_supabase.csv`
  - `TABLAS/entradas_supabase.csv`
  - `TABLAS/fix_csv.py`
- **Key findings**:
  - Identified incorrect references to `.data[0]` in n8n `Actualizar Cliente` node which breaks data accumulation.
  - Identified hardcoded CPF `"1"` in n8n inserts for both `clientes` and `entradas`.
  - Identified spelling discrepancy: `recurrencia` in `clientes` table vs `recorrencia` in `entradas` table.
  - Identified missing `estado` mapping for `entradas` in n8n.
  - Determined that `selectedClientId` is not passed to Global AI Chat but can be integrated.
  - Found that the only other place querying/saving `ai_chats` is `ClientView.jsx`.
- **Unexplored areas**: None.

## Key Decisions Made
- Outlined full code changes required to resolve the n8n mapping and AI Chat integration issues without writing to src files.

## Artifact Index
- c:\Users\Micro\Documents\FLUJO-CENTRO-DE-TRABAJO-main\CUBANOS_BR_MARCOS\.agents\explorer_n8n_history_1\handoff.md — Analysis and findings handoff
