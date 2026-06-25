# Project: UI/UX Refactoring (Modern Static Layout & Fixed AI Chat)

## Architecture
The application is a React-based single page dashboard. It uses custom CSS variables in `index.css` and inline React styles for layout. Key views are managed via state variables (`currentView === 'client'`).
- `src/App.jsx`: Global container. Contains the main wrapper and a routing mechanism.
- `src/components/ClientView.jsx`: Main view for individual client details, which currently uses horizontal tabs and a fixed-overlay slide-in AI chat drawer.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite | Design static/structural verification tests for the layout requirements | None | DONE |
| 2 | Global Layout & Fixed Chat | Lock viewport in `App.jsx`, embed AI Chat as persistent right panel in `ClientView.jsx` | M1 | DONE |
| 3 | Unified Scroll & Quick Nav | Stack data sections in a central scrollable div, add left navigation anchor menu | M2 | DONE |
| 4 | Optimization & Linting | Refactor spacing, fix misalignments, run oxlint, and resolve all review findings | M3 | DONE |

## Interface Contracts
### `ClientView.jsx` Layout Interface
- **Left Column**: Quick Navigation sidebar. Anchors jump to specific sections using DOM scroll.
- **Center Column**: Unified vertically scrollable content container containing all client info sections.
- **Right Column**: Persistent AI Chat sidebar (always visible, does not overlap).
- **Global constraints**: Window does not scroll (`overflow: hidden` on main wrapper).
