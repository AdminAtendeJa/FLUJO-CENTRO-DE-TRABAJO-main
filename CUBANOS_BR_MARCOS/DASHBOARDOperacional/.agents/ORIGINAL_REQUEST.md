# Original User Request

## 2026-06-25T00:12:05Z

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

## Follow-up — 2026-06-25T12:30:27Z

# Teamwork Project Prompt — Draft

Optimize the layout of the `ClientView.jsx` component to maximize horizontal space, making it as spacious and clean as the main 'Trámites' dashboard. The AI Chat panel must be removed from the fixed layout grid and converted into a hidden, toggleable drawer that only appears when a specific button is clicked, freeing up screen real estate for client data.

Working directory: `c:/Users/Micro/Documents/FLUJO-CENTRO-DE-TRABAJO-main/CUBANOS_BR_MARCOS/DASHBOARDOperacional`
Integrity mode: development

## Requirements

### R1. Expand Main Content Area
Refactor the grid layout in `ClientView.jsx`. Remove the fixed 400px right-hand column dedicated to the AI chat. Allow the central scrollable data container to expand and occupy the majority of the screen, creating a spacious, easy-to-read view similar to the main dashboard.

### R2. Toggleable AI Chat Drawer
The AI Chat within `ClientView.jsx` should no longer be permanently visible. Convert it into a collapsible/slide-out drawer or overlay. Implement a button (e.g., "Asistente IA") in the top header or floating locally that toggles this chat panel. When closed, the chat must not consume any grid space.

### R3. Visual Hierarchy & Spacing
Adjust the internal margins, paddings, and grid columns of the client data cards (`Informaciones Personales`, `Datos Familiares`, `Documentos`, etc.) to take full advantage of the newly available width. Ensure that the most critical information is immediately visible without feeling cramped.

## Acceptance Criteria

### Verification
- [ ] `ClientView.jsx` no longer has a fixed 3-column grid that permanently reserves 400px for the AI chat.
- [ ] The AI chat is hidden by default and only opens when explicitly requested via a toggle button.
- [ ] When the AI chat is opened, it acts as an overlay or collapsible drawer, rather than permanently crushing the width of the main data columns.
- [ ] The central data area expands fluidly to fill the available space, displaying client data spaciously.
- [ ] The codebase passes standard React linting and runs locally without breaking existing features.

