# PRD - Basketball Referee Manager Recreation

## Original Problem Statement
Review the GitHub repository and recreate `https://github.com/MRK2340/basketball-referee-manager`.
Build an AAU youth basketball league manager app where Referees can view their schedule, log availability, and communicate with managers, while Managers can assign referees and manage tournaments.

## User Choices
- Rebuild the full app as closely as possible
- Match the GitHub codebase closely
- Clean up weak areas during recreation
- Phase 1 request: include all Phase 1 items now
- Keep current images for now and only do test IDs + cleanup
- Apply strong cleanup while keeping the same product
- Phase 2: All P0 items at once (delete tournament, reply/forward messages, full data export)
- Phase 2: Full data export (payments + schedules)
- Phase 2: Build P0 + P1 (Notification Center) all in one go

## Architecture Decisions
- Preserved the React + Vite recreation structure
- Kept the local browser-storage data layer for end-to-end functionality in this environment
- Retained current remote images per user preference during Phase 1
- Adopted a cleaner Swiss/high-contrast light dashboard shell with stronger spacing, typography, and card hierarchy
- Standardized data-testid coverage on major routes, controls, manager tools, and dialogs
- Added `start` script to package.json and `/app/frontend` launcher to fix supervisor configuration
- Added `watch: { followSymlinks: false }` to vite.config.js to prevent ELOOP crash

## What Has Been Implemented

### Phase 1 (Session 1 - DONE)
- Recreated role-based app flows for referee and manager users with persistent local demo data
- Phase 1 UI cleanup across shell, dashboard, profile, calendar, games, payments, settings, and manager views
- Added broader data-testid coverage to major interactive elements
- Fixed manager route mismatch so the intended Phase 1 manager component renders at /manager

### Phase 2 (Session 2 - DONE)
- **Delete Tournament**: AlertDialog confirm flow with cascade delete (games, assignments, payments, reports)
- **Reply Message**: Opens compose with "Re: {subject}" and sender pre-set as recipient
- **Forward Message**: Opens compose with "Fwd: {subject}" and quoted original body
- **Export Payments CSV**: Downloads payments data including game info
- **Export Schedule CSV**: Downloads all games/schedule data
- **Notification Center**: Bell icon → Sheet slide-out panel from right side
  - Types: message, assignment, payment, game_request, report
  - Seeded notifications + auto-created on key events (assign, message, report, game_request)
  - Per-notification mark-read + "Mark all read" button
  - Click notification → mark read + navigate to relevant route
  - Unread badge count in TopBar bell icon
- Fixed prop name mismatch in Manager/index.jsx (onAddTournament → addTournament)

## Checklist Status
- [x] Expand test IDs across major pages, buttons, tabs, and dialogs
- [x] Refresh shell styling, spacing, cards, and typography
- [x] Clean manager area and key operational screens
- [x] Keep current images unchanged per request
- [x] Delete Tournament flow with confirm dialog
- [x] Reply/Forward message actions
- [x] Export payments + schedule CSV
- [x] Notification Center with bell icon, panel, mark read
- [ ] Extend test IDs to every remaining secondary form/control in less-used pages
- [ ] Phase 3: Assignment-Conflict Assistant

## Prioritized Backlog

### P0 (Done)
- All Phase 2 manager productivity features

### P1 - Next
- Phase 3: Assignment-Conflict Assistant
  - Detect scheduling conflicts when assigning referees
  - Flag unavailable referees based on calendar data
  - Suggest best-fit referees based on availability, rating, certifications

### P2 - Future
- Replace browser-storage data layer with real backend/Supabase when credentials are available
- Multi-referee bulk assignment actions
- Payment batch processing / mark paid

## Next Tasks
- Phase 3: Assignment-Conflict detection in GameAssignmentsTab
- Improve notification deep-link UX with URL anchoring
- Add referee availability overlay in assignment dialog
