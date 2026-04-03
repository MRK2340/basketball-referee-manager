# PRD - Basketball Referee Manager Recreation

## Original problem statement
Review the GitHub repository and recreate.

## User choices
- Rebuild the full app as closely as possible
- Match the GitHub codebase closely
- Clean up weak areas during recreation
- Phase 1 request: include all Phase 1 items now
- Keep current images for now and only do test IDs + cleanup
- Apply strong cleanup while keeping the same product

## Architecture decisions
- Preserved the React + Vite recreation structure
- Kept the local browser-storage data layer for end-to-end functionality in this environment
- Retained current remote images per user preference during Phase 1
- Adopted a cleaner Swiss/high-contrast light dashboard shell with stronger spacing, typography, and card hierarchy
- Standardized data-testid coverage on major routes, controls, manager tools, and dialogs

## What has been implemented
- Recreated role-based app flows for referee and manager users with persistent local demo data
- Phase 1 UI cleanup across shell, dashboard, profile, calendar, games, payments, settings, and manager views
- Added broader data-testid coverage to major interactive elements, manager actions, settings cards, and scheduling dialogs
- Fixed manager route mismatch so the intended Phase 1 manager component renders at /manager
- Improved form/dialog contrast and consistency while keeping current remote imagery intact

## Checklist status
- [x] Expand test IDs across major pages, buttons, tabs, and dialogs
- [x] Refresh shell styling, spacing, cards, and typography
- [x] Clean manager area and key operational screens
- [x] Keep current images unchanged per request
- [ ] Extend test IDs to every remaining secondary form/control in less-used pages

## Prioritized backlog
### P0
- Finish remaining secondary data-testid coverage in lower-priority controls and nested settings toggles
- Normalize any remaining low-contrast labels or legacy component styles in secondary pages

### P1
- Implement secondary manager actions: delete tournament, reply/forward message, export payments
- Add richer notification center from the bell icon with deep links

### P2
- Add assignment-conflict assistant and referee recommendation logic
- Replace browser-storage data layer with real backend/Supabase when credentials are available

## Next tasks
- Phase 2: manager productivity actions (delete tournament, message actions, export flows)
- Add notification center interactions and read states
- Build assignment conflict detection and suggested referee matching
