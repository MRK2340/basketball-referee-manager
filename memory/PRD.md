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
- Phase 3: Assignment-Conflict Assistant + enhancement (live conflict badge)

## Architecture Decisions
- Preserved the React + Vite recreation structure
- Kept the local browser-storage data layer for end-to-end functionality
- Added `start` script to package.json and `/app/frontend` launcher to fix supervisor configuration
- Added `watch: { followSymlinks: false, ignored: [...] }` to vite.config.js
- Installed `@radix-ui/react-tooltip` and `@radix-ui/react-scroll-area` packages
- Bumped storage key to `iwhistle_demo_data_v3` for fresh seed with conflict scenario data

## What Has Been Implemented

### Phase 1 (Session 1 - DONE)
- Recreated role-based app flows for referee and manager users with persistent local demo data
- Phase 1 UI cleanup across shell, dashboard, profile, calendar, games, payments, settings, and manager views
- Added broader data-testid coverage to major interactive elements
- Fixed manager route mismatch

### Phase 2 (Session 2 - DONE)
- **Delete Tournament**: AlertDialog confirm flow with cascade delete
- **Reply Message**: Pre-fills Re: subject + sender as recipient
- **Forward Message**: Pre-fills Fwd: subject + quoted original body
- **Export Payments CSV** + **Export Schedule CSV**: Dropdown on Payments page
- **Notification Center**: Bell icon → Sheet panel, 5 types, seeded + auto-created, mark read, badge count

### Phase 3 (Session 3 - DONE)
- **`conflictUtils.js`**: Pure conflict detection utility
  - `getScheduleConflicts(refereeId, game, allGames)` — 90-min overlap detection
  - `isRefereeAvailable(referee, game)` — availability window matching
  - `hasCertifications(referee, game)` — required cert check
  - `getRefereeStatus(referee, game, allGames)` — unified status: available | unavailable | conflict | missing-certs | no-data
  - `rankReferees(referees, game, allGames)` — sorts by fit score (status + rating + experience)
- **Live conflict badges in GameAssignmentsTab**:
  - Per-referee chip: `✓ Ready`, `⚠ Conflict`, `✗ Unavailable`, `Missing Cert`, `No Avail. Data`
  - Game row: orange left border + `⚠ Conflict` indicator when any assigned referee has an issue
  - Hidden for completed games (read-only history)
- **Enhanced AssignRefereeDialog**:
  - Ranked referee cards (sorted best-fit first)
  - Per-card colored status badge (traffic-light system)
  - "Best fit" green banner when top referee is fully available
  - Conflict/unavailable/missing-cert detail text on card selection
  - Required certifications shown as badges in dialog header
  - Confirm button updates with selected referee's name
- **Demo seed data for all scenarios**:
  - game-5 (River City Bulls, Apr 7 16:30) overlaps game-3 (Lake City Panthers, Apr 7 16:00) — Jordan assigned to both = visible conflict
  - Olivia has availability window covering game-3 — shows Ready
  - Demo Referee availability only covers game-1 — shows correct status for other games

## Checklist Status
- [x] Phase 1: UI polish, testIDs, shell cleanup
- [x] Phase 2: Delete tournament, reply/forward, CSV export, notification center
- [x] Phase 3: Assignment-conflict detection, live conflict badges, ranked assign dialog
- [ ] Phase 4: Replace localStorage with real backend/Supabase
- [ ] Bulk referee assignment + payment batch processing

## Prioritized Backlog

### P1 - Next
- Replace browser-storage data layer with real Supabase/FastAPI backend when credentials available
- Multi-referee bulk assignment actions
- Payment batch processing / mark paid

### P2 - Future
- Referee self-service: accept/decline games with reason
- Push notifications (web push or email via Resend/SendGrid)
- Tournament bracket / standings view
- Mobile PWA wrapper

## Next Tasks
- Referee-side flow polish: accept/decline assignment with conflict check
- Improve notification deep-link UX
- Add referee availability overlay in assignment dialog (calendar view)
