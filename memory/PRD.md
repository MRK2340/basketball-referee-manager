# PRD - iWhistle Basketball Referee Manager

## Original Problem Statement
Recreate the GitHub repository `MRK2340/basketball-referee-manager`. Build an AAU youth basketball league manager app where:
- **Referees** can view their schedule, log availability, and communicate with managers
- **Managers** can assign referees and manage tournaments

**User Decision**: Build all rich frontend UI/UX features FIRST using mocked local storage backend, then connect Firebase at the very end.

## App Overview
**Brand**: iWhistle — "Leadership Under Pressure"  
**Tagline**: "Master the Moment. Lead with Confidence."  
**URL**: Pure Vite/React frontend at port 3000, no traditional backend  
**Data**: Live Firebase Firestore (`refereemanager` database)

## Tech Stack
- React (Vite)
- Tailwind CSS + Shadcn/UI  
- Framer Motion
- **Firebase** (Auth + Firestore) — replaced local storage mock layer
- `jspdf` + `jspdf-autotable` for PDF exports
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
├── App.jsx (lazy-loaded routes via React.lazy/Suspense)
├── index.css (brand colors, Arial font)
├── styles/iwhistle-brand.css (CSS variables)
├── tailwind.config.js (brand-blue #0080C8, brand-orange #FF8C00)
├── contexts/ (AuthContext.jsx, DataContext.jsx, ThemeContext.jsx)
├── hooks/ (useDataFetching.js, useAvailabilityActions.js, useGameActions.js, etc.)
├── lib/
│   ├── firebase.js          — Firebase app init (uses VITE_ env vars)
│   ├── firestoreService.js  — Async Firestore DB service (replaces demoDataService.js)
│   ├── seedFirestore.js     — Auto-seeds demo data on first login
│   └── exportIndependentGames.js — CSV/PDF export logic
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

## Firestore Collections (DB ID: `refereemanager`)
`tournaments`, `games`, `game_assignments`, `game_reports`, `profiles`, `messages`, `notifications`, `refereeAvailability`, `manager_connections`, `independent_games`, `_meta` (seed guard)

## What's Been Implemented

### Phase 1 - Core App (Complete)
- Auth flow (login/register/demo accounts)
- Manager dashboard with 7 tabs
- Referee dashboard with schedule/games/payments/messages/calendar
- Full mock data layer (demoDataService.js) — **replaced by Firebase**

### Phase 2 - Top-Notch UI Features (Complete)
- Referee Post-Game Rating System
- Tournament Standings Tab
- Referee Leaderboard
- Live Activity Feed on Dashboard
- Game Detail Slide-out Panel (GameDetailSheet.jsx)
- Enhanced Game Reports
- Working Notification Preferences (persisted)
- Calendar Week View
- Open Games Smart Sorting
- Empty States & Skeleton Loading States (SkeletonCard.jsx)
- Referee Availability Calendar Tab (AvailabilityCalendarTab.jsx)

### Phase 3 - iWhistle Brand Redesign (Complete)
- Applied iWhistle Brand Style Guide v2.0 across entire app
- Font: Arial, Colors: #0080C8 / #003D7A / #FF8C00
- Testing: 24/24 brand checks passed (iteration_7.json)

### Phase 4 - Dark Mode Toggle (Complete)
- ThemeContext.jsx with localStorage persistence
- Sun/Moon toggle in TopBar
- Dark theme: Deep Blue palette
- Testing: 14/14 checks passed (iteration_8.json)

### Phase 5 - Referee–Manager Connection System (Complete)
- `manager_connections` data model
- /find-managers route for referees, Roster tab for managers
- Testing: 17/17 checks passed (iteration_9.json)

### Phase 6 - Real-time Conflict Warnings (Complete)
- ConflictSummaryPanel, per-day conflict badges, conflict stat card
- Quick-assign popover with double-booking warnings
- Testing: 14/14 checks passed (iteration_10.json)

### Phase 7 & 8 - Code Review Fixes (Complete)
- Null guards, React.lazy/Suspense, security fixes, dead code removal
- Testing: 11/11 (iteration_11.json), 10/10 (iteration_12.json)

### Phase 9 - Independent Game Log (Complete)
- `independent_games` Firestore collection
- 2-tab Games page: Assigned Games + Independent Log
- Add/Edit/Delete game dialog, search & filter by type
- Year-end summary stats row
- Testing: 13/13 checks passed (iteration_13.json)

### Phase 10 - Year-End Export (Complete)
- Export banner in Independent Log tab (select year → CSV or PDF)
- CSV: native Blob/URL with headers + totals footer
- PDF: iWhistle-branded (jsPDF + jspdf-autotable) with orange accents
- Testing: 13/13 export tests passed (iteration_14.json)

### Phase 11 - Firebase Migration (Complete — Apr 2026)
- Installed `firebase` SDK
- Created `firebase.js` — initializeApp, getAuth, getFirestore
- Rewrote `AuthContext.jsx` — Firebase Auth (signIn, createUser, onAuthStateChanged)
- Created `firestoreService.js` — async Firestore service replacing demoDataService.js
- Created `seedFirestore.js` — auto-seeds demo data on first dual login
- Updated all hooks + DataContext to async Firestore calls
- Fixed nested getDocs bug for referee tournament query (iteration_16)
- Testing: 12/12 e2e flows passing (iteration_16.json)

### Phase 12 - Register.jsx Testability Fix (Complete — Apr 2026)
- Added `data-testid` to all form inputs: `register-name-input`, `register-email-input`,
  `register-phone-input`, `register-role-select`, `register-password-input`,
  `register-confirm-password-input`, `register-submit-button`
- Added `autoComplete` hints: name, email, tel, new-password

## Test Credentials
- Manager: `manager@demo.com` / `manager123`
- Referee: `referee@demo.com` / `Referee123` (capital R)

## Prioritized Backlog

### P2 (Future / Optional)
- Context namespace refactor (Issue #9 from Code Review)
- camelCase vs snake_case consolidation (Issue #10) — defer until further backend work
