# PRD - Basketball Referee Manager App

## Problem Statement
Recreate `MRK2340/basketball-referee-manager` — an AAU youth basketball league manager app where:
- **Referees**: view schedule, log availability, communicate with managers
- **Managers**: assign referees, manage tournaments, track performance

**Critical Note**: All features are built with a mocked localStorage backend (Supabase will be connected at the final phase, per user request).

## User Personas
- **Manager** (league admin): manages tournaments, assigns referees, reviews reports, tracks payments
- **Referee** (officials): checks schedule, sets availability, accepts/declines games, submits reports

## Core Requirements
- Role-based auth: Manager vs Referee views
- Tournaments: create, edit, delete
- Games: schedule, assign referees, mark complete
- Calendar: availability logging, month/week/day views
- Schedule: open games with smart filtering, my schedule with conflict detection
- Messages: threaded communication between roles
- Payments: tracking, CSV export, bulk mark-as-paid
- Game Reports: submit post-game reports, manager resolution notes
- Notifications: bell icon panel, in-app activity feed

---

## Architecture
```
/app (React + Vite + Tailwind + Shadcn UI)
├── src/
│   ├── App.jsx
│   ├── components/ (Layout, Sidebar, BottomNavigation, TopBar, NotificationPanel, GameDetailSheet, SkeletonCard)
│   ├── contexts/ (AuthContext, DataContext)
│   ├── hooks/ (useDataFetching, useTournamentActions, useAssignmentActions, useGameActions, etc.)
│   ├── lib/ (demoDataService.js — CORE mocked DB, conflictUtils.js)
│   ├── pages/
│   │   ├── Manager/ (index.jsx — 6 tabs, TournamentsTab, GameAssignmentsTab, RefereeManagementTab, GameReportsTab, StandingsTab, LeaderboardTab, RatingDialog)
│   │   ├── Schedule/ (tabs: MyScheduleTab, OpenGamesTab [smart sorting])
│   │   ├── Settings/ (NotificationsSettings, PreferencesSettings, AccountSecuritySettings)
│   │   ├── Dashboard.jsx, Profile.jsx, Calendar.jsx, Games.jsx, Messages.jsx, Payments.jsx, GameReport.jsx
```

---

## What's Been Implemented

### Phase 1 — UI/UX Polish (Complete ✅)
- High-contrast light theme (Swiss design aesthetic)
- Shadcn UI components throughout
- data-testid coverage
- Design guidelines generated (`/app/design_guidelines.json`)

### Phase 2 — Manager Actions (Complete ✅)
- Delete tournament confirm dialog
- Reply/Forward message actions
- Export Payments (CSV) dropdown
- Notification Center (bell icon panel)

### Phase 3 — Assignment-Conflict Assistant (Complete ✅)
- `conflictUtils.js` for conflict detection
- Live conflict badges/traffic-light status in GameAssignmentsTab
- Conflict-aware Referee Accept/Decline Warning dialog
- Calendar Availability Strip in Assign Dialog and Referee Cards

### Phase 4 — Bulk Actions & Polish (Complete ✅)
- Bulk select & actions for Game Assignments
- Bulk mark-as-paid for Payments
- Referee accept conflict warning dialog

### Phase 5 — Top-Notch Rich Features (Complete ✅, April 2026)
1. **Referee Post-Game Rating System** — RatingDialog.jsx, star ratings + feedback per referee, profile rating history
2. **Tournament Standings Tab** — StandingsTab.jsx, W/L records per team computed from scores
3. **Referee Leaderboard Tab** — LeaderboardTab.jsx, sort by rating/games/acceptance, Assign shortcut
4. **Live Activity Feed** — Dashboard.jsx bottom section, role-personalized timeline from notifications
5. **Game Detail Slide-out Panel** — GameDetailSheet.jsx, shared component for all views
6. **Enhanced Game Reports** — Technical Fouls, Personal Fouls, Ejections, MVP Player fields
7. **Working Notification Preferences** — localStorage persisted, syncs after hard reload via useEffect
8. **Calendar Week View** — hourly slots (7am–10pm), game blocks placed by time, prev/next navigation
9. **Open Games Smart Sorting** — search, sort (Date/Pay/Best Match), filter panel (Division/Date Range/Min Pay)
10. **Empty States & Loading States** — SkeletonCard.jsx, rich empty states with icons and context

---

## Upcoming/Backlog

### P0 — Supabase Connection (Final Phase)
- Remove demoDataService.js mock layer
- Implement real Supabase API calls for auth, games, assignments, reports, payments, messages
- Migration: connect all existing UI flows to Supabase tables

### P1 — Future Polish
- Push notification service integration (real-time updates)
- Email digest integration
- Mobile-responsive improvements for small screens

---

## Data Model (mocked via localStorage)
- `tournaments`, `games`, `game_assignments`, `game_reports`
- `profiles`, `messages`, `notifications`
- `refereeRatings` — post-game referee performance ratings
- `notificationPreferences` — per-user notification preference map
- `refereeAvailability` — calendar availability slots

## Test Credentials
- Manager: `manager@demo.com` / `password` (or use "Try Demo Account" → "Log in as Manager")
- Referee: `referee@demo.com` / `password` (or use "Try Demo Account" → "Log in as Referee")
