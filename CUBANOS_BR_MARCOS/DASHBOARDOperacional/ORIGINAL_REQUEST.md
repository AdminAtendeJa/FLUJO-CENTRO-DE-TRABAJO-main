# Original User Request

## Initial Request — 2026-06-24T23:33:44Z

# Teamwork Project Prompt — Draft

Refactor the React application's UI/UX to create a modern, static layout where the AI Chat is permanently fixed. Convert the main data sections (Personal Data, Family, Documents) from horizontal tabs into a unified, vertically scrollable container, optimizing code structure and spacing along the way.

Working directory: `c:/Users/Micro/Documents/FLUJO-CENTRO-DE-TRABAJO-main/CUBANOS_BR_MARCOS/DASHBOARDOperacional`
Integrity mode: development

## Requirements

### R1. Global Static Layout & Fixed AI Chat
The main application layout must not have a global page scroll (`100vh`, `overflow: hidden`). The AI Chat component must be redesigned as a persistent, fixed right-hand sidebar. It must always be visible and take up its own dedicated space (not overlapping the main content).

### R2. Unified Vertical Scroll & Quick Nav
The current UI separating "Datos Personales", "Familiares", and "Documentos" horizontally must be refactored into a single vertically scrolling container in the center of the screen. Additionally, implement a small left-hand navigation menu (anchors) to allow quickly jumping to specific sections within the scrollable container.

### R3. Code & Spacing Optimization
Review and refactor the component code (e.g., `ClientView.jsx`) applying React best practices. Redefine CSS spacing, margins, and paddings to ensure a clean, modern, and breathable UI. Fix any existing visual bugs or misalignments.

## Acceptance Criteria

### UI Layout
- [ ] The browser window does not scroll globally (overflow: hidden on main wrapper).
- [ ] The AI Chat is a constantly visible right sidebar, not obscuring any data.
- [ ] A left-side quick navigation menu exists to jump between sections.
- [ ] "Datos Personales", "Familiares", and "Documentos" are rendered in a single central vertically scrolling `div`.
- [ ] Scrolling inside the central data container works smoothly without affecting the left nav or right chat.
- [ ] The codebase passes standard React linting and runs locally without visual breaking errors.

## Follow-up — 2026-06-25T00:12:05Z

# Teamwork Project Prompt — Draft

Implement a Global Artificial Intelligence Assistant for the entire application. The AI should be accessible from any screen (Dashboard, Client List, etc.) and be capable of answering general questions about the CRM, statistics, and multiple clients, extending beyond the current single-client context.

Working directory: `c:/Users/Micro/Documents/FLUJO-CENTRO-DE-TRABAJO-main/CUBANOS_BR_MARCOS/DASHBOARDOperacional`
Integrity mode: development

## Requirements

### R1. Global AI UI Component
Create a persistent Global AI interface accessed via a floating action button (bottom-right) that opens a chat panel over any screen. The chat history must persist as the user navigates between different pages (Dashboard, Client View) using React Context or global state.

### R2. Global Context & Tool Calling
Refactor the AI service to support functional tool calling (Groq tool use / function calling). The AI must understand general conversational context and decide when to call specific tools to get information from the database.

### R3. Safe Database Tools (Function Calling)
Implement specific, safe JavaScript functions that query Supabase, which the AI can invoke as tools. For example:
- `searchClientsByName(name)`
- `countPendingProcedures()`
- `getOverallStats()`
This prevents the need to inject the entire database into the prompt or expose raw SQL.

## Acceptance Criteria

### Verification
- [ ] A floating action button exists globally and opens the AI chat without disrupting the background UI.
- [ ] The chat history persists when navigating between routes.
- [ ] The AI correctly uses function calling to answer a question about global metrics (e.g., "Dime cuántos trámites pendientes hay en total").
- [ ] The AI correctly uses function calling to search for a client by name across the entire database.
- [ ] The codebase passes standard React linting and runs locally without breaking existing features.
