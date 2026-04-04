# PRD - Basketball Referee Manager Recreation

## Original Problem Statement
Recreate `https://github.com/MRK2340/basketball-referee-manager`. Build an AAU youth basketball league manager app where Referees can view their schedule, log availability, and communicate with managers, while Managers can assign referees and manage tournaments.

## Architecture
- React + Vite + Tailwind CSS + Framer Motion + Shadcn UI
- Browser localStorage as data layer (no backend — Supabase replaced)
- Storage key: `iwhistle_demo_data_v3`
- Supervisor: `/app/frontend` launcher → `cd /app && yarn start` → Vite on port 3000
- vite.config.js: `watch: { followSymlinks: false, ignored: [...] }`

## What Has Been Implemented

### Phase 1 — UI Polish (Session 1, DONE)
- Role-based flows: Manager and Referee with demo accounts
- Full UI cleanup across shell, dashboard, profile, calendar, games, payments, settings, manager views
- Comprehensive data-testid coverage

### Phase 2 — Manager Actions (Session 2, DONE)
- Delete Tournament with AlertDialog + cascade delete
- Reply/Forward Messages with pre-filled subject/recipient/body
- Export Payments CSV + Export Schedule CSV dropdown
- Notification Center: bell → Sheet panel, 5 types, mark read, badge count

### Phase 3 — Assignment-Conflict Assistant (Session 3, DONE)
- `conflictUtils.js`: schedule overlap, availability check, cert check, fit scoring, rankReferees()
- Live conflict badges per referee chip in Game Assignments table
- Orange left-border + conflict indicator on game rows
- Enhanced AssignRefereeDialog: ranked cards, best-fit banner, conflict detail text, cert badges

### Phase 4 — Advanced Flows (Session 4, DONE)
- **Referee Accept with Conflict Warning**: AcceptConflictWarningDialog — detects conflict/unavailable before accepting, lets referee override
- **Decline dialog restyled**: light theme (white bg, slate text)
- **Calendar Availability Overlay in Assign Dialog**: WeekCalendarStrip — 7-day strip centered on game date, green=available / orange=assigned / grey=no data
- **Bulk Assignment Actions**: Select All/individual checkboxes on game rows, bulk toolbar — "Unassign All Referees" + "Mark as Complete"
- **Payment Batch Processing**: Checkboxes on pending payments, "Select All Pending", bulk "Mark as Paid" toolbar
- `batchUnassignRefereesRecord` + `batchMarkPaymentsPaidRecord` added to demoDataService.js
- Accept/Decline creates notification to manager

## Credentials
- Manager: `manager@demo.com` / `password` (via Try Demo Account)
- Referee: `referee@demo.com` / `password` (via Try Demo Account)

## Prioritized Backlog

### P1 — Next
- Replace browser localStorage with real Supabase/FastAPI backend when credentials available
- Push notifications (web push or Resend email)
- Tournament bracket / standings view

### P2 — Future
- Mobile PWA wrapper
- Referee rating system (post-game feedback)
- Multi-season archive / reporting
