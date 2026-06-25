# Project Orchestrator Plan: UI/UX Refactoring

This document outlines the step-by-step execution plan for the UI/UX refactoring task.

## Execution Strategy (Dual-Track)
1. **Testing Track**: Spawn an E2E testing subagent to define test assertions for:
   - Viewport height lock (`100vh` + `overflow: hidden`).
   - Constant visibility of the AI Chat as a right-hand sidebar.
   - Vertically scrolling center column containing Datos Personales, Familiares, and Documentos.
   - Left-hand navigation quick links with scroll anchors.
   - Successful linting and code optimization.
   We will write `test/layout.test.js` which verifies these constraints statically and structurally by parsing/checking `App.jsx` and `ClientView.jsx`.

2. **Implementation Track**: Spawn a worker subagent to make the code modifications.
   - Modify `src/App.jsx` to lock scrolling on `main` when `currentView === 'client'`.
   - Modify `src/components/ClientView.jsx` to restructure the layout from dynamic horizontal tabs to a stacked vertical scroll layout with three columns: left quick-nav, middle scrollable data content, and right persistent AI Chat.
   - Clean up CSS spacing, borders, padding, and run linting checks.

3. **Verification & Audit Track**:
   - Run the custom E2E test suite.
   - Run oxlint checks.
   - Spawn a Forensic Auditor subagent to perform integrity checks.

## Milestones and Status
- **Milestone 1: E2E Test Suite Creation** [PLANNED]
- **Milestone 2: Layout & Chat Restructuring** [PLANNED]
- **Milestone 3: Unified Scroll & Quick Nav** [PLANNED]
- **Milestone 4: Polish, Linting & Auditor Review** [PLANNED]
