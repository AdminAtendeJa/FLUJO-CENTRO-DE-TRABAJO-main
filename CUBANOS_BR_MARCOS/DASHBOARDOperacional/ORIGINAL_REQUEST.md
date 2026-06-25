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
