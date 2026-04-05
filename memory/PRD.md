# PRD - iWhistle Basketball Referee Manager

## Original Problem Statement
Recreate the GitHub repository `MRK2340/basketball-referee-manager`. Build an AAU youth basketball league manager app where:
- **Referees** can view their schedule, log availability, and communicate with managers
- **Managers** can assign referees and manage tournaments

**User Decision**: Build all rich frontend UI/UX features FIRST using mocked local storage backend, then connect Supabase at the very end.

## App Overview
**Brand**: iWhistle — "Leadership Under Pressure"  
**Tagline**: "Master the Moment. Lead with Confidence."  
**URL**: Pure Vite/React frontend at port 3000, no backend  
**Data**: Fully mocked via localStorage (`demoDataService.js`)

## Tech Stack
- React (Vite)
- Tailwind CSS + Shadcn/UI  
- Framer Motion
- Local Storage mock data layer
- iWhistle Brand Style Guide v2.0 (Dec 2025)

## Brand Specification (iWhistle v2.0)
- **Primary Blue**: #0080C8
- **Deep Blue**: #003D7A
- **Light Blue**: #4DB8E8
- **Primary Orange**: #FF8C00
- **Burnt Orange**: #E67300
- **Font**: Arial, Helvetica, sans-serif
- **Color Balance**: 60% White, 30% Blue, 10% Orange

## Architecture
```
/app/src/
├── App.jsx
├── index.css (brand colors, Arial font)
├── styles/iwhistle-brand.css (CSS variables)
├── tailwind.config.js (brand-blue #0080C8, brand-orange #FF8C00)
├── contexts/ (AuthContext.jsx, DataContext.jsx)
├── hooks/ (useDataFetching.js, useAvailabilityActions.js, etc.)
├── lib/ (demoDataService.js — core mock data layer)
├── components/ (Layout, Sidebar, TopBar, BottomNavigation, GameDetailSheet, etc.)
└── pages/
    ├── LandingPage.jsx, Login.jsx, Register.jsx
    ├── Dashboard.jsx, Profile.jsx, Calendar/, Schedule/, Games.jsx
    ├── Payments.jsx, Messages.jsx, Settings.jsx
    ├── PerformanceAnalytics.jsx, GameReport.jsx
    ├── AboutPage.jsx, ContactPage.jsx
    └── Manager/
        ├── index.jsx (7-tab manager hub)
        ├── AvailabilityCalendarTab.jsx
        ├── LeaderboardTab.jsx
        ├── StandingsTab.jsx
        ├── TournamentsTab.jsx
        └── ... (more tabs)
```

## What's Been Implemented

### Phase 1 - Core App (Complete)
- Auth flow (login/register/demo accounts)
- Manager dashboard with 7 tabs
- Referee dashboard with schedule/games/payments/messages/calendar
- Full mock data layer (demoDataService.js) with all CRUD operations

### Phase 2 - Top-Notch UI Features (Complete — 2025)
- Referee Post-Game Rating System
- Tournament Standings Tab
- Referee Leaderboard
- Live Activity Feed on Dashboard
- Game Detail Slide-out Panel (GameDetailSheet.jsx)
- Enhanced Game Reports
- Working Notification Preferences (persisted to localStorage)
- Calendar Week View
- Open Games Smart Sorting
- Empty States & Skeleton Loading States (SkeletonCard.jsx)
- Referee Availability Calendar Tab (AvailabilityCalendarTab.jsx)

### Phase 3 - iWhistle Brand Redesign (Complete — Apr 2026)
- Updated all "Basketball Reff" → "iWhistle" across entire app
- Applied iWhistle Brand Style Guide v2.0:
  - Font: Arial (replaced IBM Plex Sans + Cabinet Grotesk)
  - Colors: #0080C8 blue, #003D7A deep blue, #FF8C00 orange
  - "Leadership Under Pressure" tagline on login/landing
  - iWhistle logo with gradient border (blue → orange)
  - Active nav states: #E6F2F8 background, #0080C8 text
  - Notification badges, buttons, CTAs: brand colors
  - CSS variables updated (iwhistle-brand.css)
  - Tailwind config updated (brand-blue, brand-orange, brand-blue-deep, brand-blue-light)
- Testing: 24/24 brand checks passed (iteration_7.json)

### Phase 5 - Referee–Manager Connection System (Complete — Apr 2026)
- New data model: manager_connections {id, referee_id, manager_id, status: pending|connected|declined, note, created_at}
- 3 additional manager profiles seeded: Thomas Washington (Capitol Hoops D.C.), Sarah Chen (Bay Area Youth Basketball), Marcus Johnson (Midwest AAU)
- /find-managers route (referee-only): browse managers, filter by name/league/location, send roster requests with note, withdraw pending requests
- Roster tab in Manager panel: incoming requests (Accept/Decline), connected referee roster with expandable contact info
- Pending request badge on Roster tab in Manager nav
- Multi-manager support: referees can be on unlimited rosters simultaneously
- service functions: requestManagerConnectionRecord, respondToConnectionRecord, withdrawConnectionRecord
- Testing: 17/17 checks passed (iteration_9.json)

### Phase 4 - Dark Mode Toggle (Complete — Apr 2026)
- ThemeContext.jsx with localStorage persistence ('iwhistle-theme')
- Sun/Moon toggle button in TopBar (data-testid='theme-toggle-button')
- Dark theme: Deep Blue palette — body #001829, surfaces rgba(0,28,60,0.95), text light blue/white
- Smooth CSS transitions on theme switch (0.25s ease)
- Active nav in dark mode: amber/orange accent highlighting
- Sidebar, TopBar, BottomNavigation all fully dark-mode aware
- Testing: 14/14 dark mode checks passed (iteration_8.json)

### Phase 6 - Real-time Conflict Warnings (Complete — Apr 2026)
- ConflictSummaryPanel at top of Availability tab: collapsible, shows all conflicts this week with animated ping dot
- Per-day conflict badges in column headers (data-testid='day-conflict-badge-{date}')
- Individual conflict cells: red background, pulsing animation ring, game tags shown inline
- Conflict stat card with animated ping dot (data-testid='stat-conflicts')
- Conflict count badge in week label area (data-testid='conflict-count-badge')
- Quick-assign popover warns of double-booking with conflict details before assigning
- Testing: 14/14 checks passed (iteration_10.json)

### Phase 7 - Code Review Fixes (Complete — Apr 2026)
Applied all fixes from CODE_REVIEW.md (commit f6c2c62):
- **Bug**: Null guard `a.referee?.id` in Dashboard.jsx (crash prevention)
- **Bug**: "Games This Month" stat now filters by actual current month
- **Security**: `obfuscate` fixed to `btoa(encodeURIComponent(str))` — handles Unicode passwords safely; login check backward-compatible
- **Security**: 1 MB file size guard on avatar upload before localStorage write
- **Bug**: Removed double `setLoading(false)` in `uploadAvatar` — loading state owned by single caller
- **Quality**: Deprecated `.substr()` → `.substring()` in AuthContext
- **Quality**: Removed dead `sendMessage`/`games` params from `useAssignmentActions`
- **Performance**: React.lazy + Suspense for all 13 page routes in App.jsx — reduces initial bundle size
- Testing: 11/11 regression checks passed (iteration_11.json)

### Phase 8 - CODE_REVIEW.md Round 2 Fixes (Complete — Apr 2026)
- **Security**: Legacy `btoa(password)` in login wrapped in try/catch — safe for Unicode passwords
- **Bug**: Removed dead pagination state (`page`, `pageSize`, `hasMoreGames`) from `useDataFetching.js`
- **Performance**: `refreshing` state added — background mutations use `fetchData(false)`, no full-page spinner flash
- **Quality**: Removed `async` from all sync action functions; ROLE_HOME map in ProtectedRoute; try/catch on notification reads; UTC `Z` suffix in conflictUtils.js; `duration_mins` fallback for variable game lengths
- Testing: 10/10 regression checks passed (iteration_12.json)

### Phase 9 - Demo Credentials Consolidation (Complete — Apr 2026)
- Created `src/lib/demoAccounts.js` — single source of truth for `DEMO_MANAGER_BASE` and `DEMO_REFEREE_BASE`
- `AuthContext.jsx` imports base profiles and spreads `password` on top at runtime
- `demoDataService.js` imports base profiles and spreads data-layer-only fields (location, league_name, bio, etc.) on top
- Schema changes now only need to be made in one place; silent drift between auth and data layers eliminated


- **Final Phase: Connect Supabase Backend (P0)** — strip out demoDataService.js and hook up real Supabase REST/GraphQL APIs for auth, games, assignments, reports, payments, messages

## Test Credentials
- Manager: `manager@demo.com` / `password`
- Referee: `referee@demo.com` / `password`
- Demo button: "Try Demo Account" on login page
