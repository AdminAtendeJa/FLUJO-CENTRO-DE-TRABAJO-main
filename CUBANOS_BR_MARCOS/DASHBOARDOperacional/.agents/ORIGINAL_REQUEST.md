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
