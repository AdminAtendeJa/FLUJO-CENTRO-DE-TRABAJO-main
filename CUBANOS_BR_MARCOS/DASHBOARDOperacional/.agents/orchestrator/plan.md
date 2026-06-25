# Project Orchestrator Plan: Global AI Assistant

This document outlines the step-by-step execution plan for the Global AI Assistant task.

## Execution Strategy (Dual-Track)
1. **Testing Track**: Spawn a Challenger subagent to define test assertions for:
   - Persistent Global AI UI component (FAB at bottom-right, Chat Drawer overlay).
   - Global Context and Chat History state persistence (switching views does not clear chat).
   - AI Service Tool Calling / function calling support using Groq.
   - Safe database tools (`searchClientsByName`, `countPendingProcedures`, `getOverallStats`) querying Supabase.
   We will write `test/globalAi.test.js` or update `test/e2e.test.js` to contain these checks.

2. **Implementation Track**: Spawn a worker subagent to make the code modifications.
   - Create `src/context/GlobalAiChatContext.jsx` for global state persistence.
   - Create `src/components/GlobalAiChat.jsx` for the FAB and Chat Drawer.
   - Modify `src/services/aiService.js` to implement safe database query functions and `chatWithTools` recursive loop.
   - Modify `src/App.jsx` to wrap with `<GlobalAiChatProvider>` and render `<GlobalAiChat />`.
   - Update CSS styles in `src/index.css` for floating animations/classes.

3. **Verification & Audit Track**:
   - Run the custom E2E test suite.
   - Run lint (`npm run lint`).
   - Spawn a Forensic Auditor subagent to perform integrity checks.

## Milestones and Status
- **Milestone 1: E2E Test Suite Creation** [PLANNED]
- **Milestone 2: Global AI UI Component & Chat History Context** [PLANNED]
- **Milestone 3: AI Service Function Calling & Database Tools** [PLANNED]
- **Milestone 4: Polish, Linting & Forensic Audit** [PLANNED]
