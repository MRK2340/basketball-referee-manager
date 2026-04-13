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

### Phase 13 - Real-time In-App Notifications (Complete — Apr 2026)
- Created `useRealtimeNotifications.js` — Firestore `onSnapshot` listener on user's notifications
- Bell badge in TopBar updates in real-time (no page refresh)
- Toast banner fires for each genuinely new notification (existing ones at login are silenced)
- Fixed pre-existing `Messages.jsx` bug: `New Message` compose "To:" was null → Firestore undefined error
  - Replaced readOnly input with dynamic `<select>` dropdown: managers → referees, referees → managers
  - Reply mode still uses readOnly recipient from original sender
  - `handleForward`/`openNewCompose` default to first valid recipient
  - Guard in `handleSendMessage` blocks sends with no recipient
- Testing: 10/10 flows passing (iteration_18.json)

### Phase 14 - Real-time Messages via onSnapshot (Complete — Apr 2026)
- Created `useRealtimeMessages.js` — Firestore `onSnapshot` on `messages` where `participants` array-contains user ID
- Inbox updates live without any page refresh; new incoming messages show a toast
- `usersMapRef` pattern keeps sender-name resolution always fresh without re-subscribing the listener
- Sender's own messages treated as `read: true` — prevents false unread badge inflation
- Wired into `DataContext.jsx` alongside notification listener (both run in parallel)
- Testing: 10/10 flows passing (iteration_19.json)



### Phase 17 - camelCase vs snake_case Consolidation (Complete — Apr 2026)
- All mapper functions (`mapGame`, `mapTournament`, `mapPayment`, `mapMessage`, `mapAvailability`, `mapGameReport`) now return ONLY camelCase fields — zero snake_case duplicates
- New `mapProfile` (avatarUrl, gamesOfficiated, leagueName, activeTournaments) and `mapConnection` (refereeId, managerId) mappers applied in `fetchAppData`
- `conflictUtils.js` rewritten to use camelCase throughout; `getRefereeStatus` export preserved
- `buildUser` in `AuthContext.jsx` exposes 4 camelCase aliases; avatar upload syncs both fields
- `Settings/NotificationsSettings.jsx`: all toggle buttons now have `role='switch'` + `aria-checked` + `aria-label` (Issue #10 accessibility fix)
- 22+ consumer files updated; 8 post-refactor regressions caught and fixed by testing agent
- Testing: 15/15 scenarios passing, 0 console errors (iteration_22.json)

### Phase 16 - Firebase Security Rules & Performance Optimization (Complete — Apr 2026)
**Security rules (apply in Firebase Console → Firestore → Rules):**
- Blocks role-escalation: users can no longer modify their own `role` field
- `_meta` seed guard: write only allowed if doc doesn't exist (prevents re-seeding)
- `referee_ratings` read scoped by role: referees see only their own ratings
- `referee_ratings` update: managers can only update ratings they originally created

**Performance improvements (code deployed):**
- `fetchAppData` now fetches all users in ONE Firestore read (split by role in JS) — saves 3 reads per page load
- `useRealtimeNotifications` + `useRealtimeMessages`: indexed `orderBy` query with automatic client-side fallback while index builds; `limit(100)` caps large accounts

**Composite indexes (`/app/firestore.indexes.json` — DEPLOYED to Firebase Apr 2026):**
- `notifications(recipient_id, created_at)` + `notifications(recipient_id, read)` 
- `messages(participants, created_at)`, `game_assignments(game_id, referee_id)`, etc.
- See `/app/memory/firebase_deployment_guide.md` for full instructions
- After deploying indexes, `orderBy` can be added to realtime hooks for server-side sorting

### Phase 15 - Context Namespace Refactor (Complete — Apr 2026)
- Grouped all flat action exports from `DataContext.jsx` into 11 named namespace objects:
  `tournamentActions`, `gameActions`, `assignmentActions`, `messageActions`, `availabilityActions`,
  `reportActions`, `notificationActions`, `paymentActions`, `connectionActions`,
  `settingsActions`, `independentGameActions`
- Updated all 20 consumer files to destructure namespaced objects instead of flat functions
- Eliminates namespace pollution in the context API; fulfills Code Review Issue #9
- Testing: 17/17 flows passing (iteration_20.json)


### Phase 18 - Firebase Storage (Profile Photo Upload) (Complete — Apr 2026)
- Added `getStorage` export to `firebase.js`
- Upgraded `uploadAvatar()` in `AuthContext.jsx` to upload to Firebase Storage `avatars/{userId}/photo`, store download URL (not base64). Limit raised to 5MB.
- Created `storage.rules`, updated `firebase.json` with storage + functions configs
- Testing: 100% pass (iteration_23.json)

### Phase 24 - A1/A2 Architectural Refactor (Complete — Apr 2026)
- **A2** `src/lib/mappers.js` (new): extracted all 8 pure mapper functions (`mapProfile`, `mapConnection`, `mapGame`, `mapTournament`, `mapPayment`, `mapMessage`, `mapAvailability`, `mapGameReport`) from `firestoreService.js`. Pure JS — no Firestore SDK — immediately unit-testable.
- **A2** `src/lib/firestoreService.js`: now imports from `./mappers`; ~100 lines shorter.
- **A1** `src/contexts/DataContext.jsx`: rewritten as a thin 80-line wiring file — all inline functions moved to domain hooks.
- **A1** 5 new hooks: `useNotificationActions`, `usePaymentActions`, `useConnectionActions`, `useSettingsActions`, `useIndependentGameActions`.
- **A1** `useAssignmentActions.js` + `useReportActions.js`: absorbed `batchUnassignReferees` and `addReportResolution` respectively.
- Context value shape unchanged — zero consumer-side changes required.
- Testing: 100% pass, 0 regressions (iteration_26.json)


- **E2** `DataContext.jsx`: `fetchData(false)` calls moved inside `try` blocks (now awaited on success only). `batchMarkPaymentsPaid` and `saveNotificationPreferences` wrapped in try/catch with error toasts.
- **E4** `AuthContext.jsx`: silent profile-fetch logout now shows a "Could not load your profile" toast before `setUser(null)`.
- **M2** `firestoreService.js`: full `getDocs(collection(db,'users'))` scan replaced with three parallel role-scoped reads (`where('role','==','referee')`, `where('role','==','manager')`, `getDoc(currentUser)`) — correct by design, scales to large user bases.
- **M3** `firestoreService.js`: messages query now uses `orderBy('created_at','desc') + limit(50)`; notifications query uses `orderBy('created_at','desc') + limit(100)`. Added `limit` to Firestore imports.
- Testing: 100% pass, 0 regressions (iteration_25.json)


- **H1** `firestoreService.js:165` — Referee game fetch: replaced N individual `getDoc()` calls with a single `where(documentId(), 'in', gameIds)` batch query. Added `chunkArray(arr, 30)` helper for Firestore's 30-item `in` limit.
- **H1** `firestoreService.js:463` — `batchUnassignRefereesRecord`: replaced N `getDocs(where game_id ==)` calls with `where('game_id', 'in', chunk)` batch.
- **M1** `firestoreService.js:234` — Availability mapping: replaced O(n²) `.filter()` inside `.map()` with a pre-built `Map<referee_id, availability[]>` for O(1) lookups.
- **P3** `Messages.jsx:40` — `filteredMessages` wrapped in `useMemo([messages, searchTerm])` — eliminates re-computation on every render.
- **A3** `src/constants.js` created — `ROLES`, `GAME_STATUS`, `ASSIGNMENT_STATUS`, `CONNECTION_STATUS`, `NOTIFICATION_TYPES`, `PAYMENT_STATUS` enums.
- Testing: 100% pass, 0 regressions (iteration_24.json)


- **C1** `Login.jsx`: demo passwords removed from component — now imported from `demoAccounts.js` (`DEMO_MANAGER_PASSWORD`, `DEMO_REFEREE_PASSWORD`)
- **C2** `firebase.js`: startup env-var validation — throws with descriptive error if any `VITE_FIREBASE_*` var is missing; created `.env.example` template
- **C3** `.gitignore`: added `memory/test_credentials.md` to prevent credential file from being committed
- **H4** `firestore.rules`: tightened `notifications` create rule from `isAuth()` → requires `['recipient_id','type','title']` fields + only managers or message-type senders can create; deployed to production
- **Q1** `vite.config.js`: removed global `console.warn = () => {}` suppressor that was silencing all development warnings


- Added `getAnalytics(app)` export to `firebase.js`
- Created `src/lib/analytics.js` — thin `Analytics` wrapper with named events: `login`, `signUp`, `logout`, `photoUploaded`, `profileUpdated`, `pushEnabled`, `pushDisabled`, `messageSent`, `gameReportSubmitted`, `independentGameLogged`, `exportGenerated`, `pageView`
- Created `src/components/RouteTracker.jsx` — fires `page_view` on every React Router navigation (mounted inside `<Router>`)
- Wired events: login/sign_up/logout in `AuthContext.jsx`, pushEnabled/pushDisabled in `useFCM.js`, photoUploaded in `AuthContext.uploadAvatar`


- Created `public/firebase-messaging-sw.js` — FCM service worker for background push
- Created `src/hooks/useFCM.js` — permission request, FCM token registration/clearing, auto-refresh
- Wired `useFCM` into `Settings.jsx`; push toggle triggers real FCM permission flow
- `NotificationsSettings.jsx` shows "Active" badge + "denied" warning based on real browser state
- Created `functions/index.js` — Cloud Function on `notifications` collection → respects user prefs → sends FCM push
- Fixed `firestoreService.js` bug: `notificationPreferences` now loaded from Firestore (was hardcoded defaults)
- VAPID key in `.env` as `VITE_FIREBASE_VAPID_KEY`
- **Deploy required**: `cd /app && firebase deploy --only functions,storage`
- Testing: 100% pass (iteration_23.json)


### Phase 25 - Message Pagination + Vitest Unit Tests (Complete — Apr 2026)
- **M2/M3** `fetchMoreMessages` in `firestoreService.js`: cursor-based Firestore pagination using `startAfter(afterTimestamp) + limit(50)`.
- `useDataFetching.js`: `hasMoreMessages` state + `loadMoreMessages` callback appends next page to inbox.
- `DataContext.jsx`: exposes `hasMoreMessages` + `loadMoreMessages` to all consumers.
- `Messages.jsx`: "Load older messages" button at bottom of inbox — only visible when `hasMoreMessages=true` AND search is empty; shows spinner during load.
- `src/__tests__/mappers.test.js` (17 tests) + `src/__tests__/constants.test.js` (12 tests) — 29/29 Vitest unit tests passing via `yarn test`.
- Testing: 100% pass — 13/13 UI scenarios + 29/29 unit tests (iteration_27.json)

### Phase 26 - Security & Quality Hardening (Complete — Apr 2026)
- **C1** `demoAccounts.js`: demo passwords removed from source — now read from `VITE_DEMO_MANAGER_PASSWORD` / `VITE_DEMO_REFEREE_PASSWORD` env vars. `.env.example` updated with both keys.
- **H** `vite.config.js`: all 3 `postMessage('*')` calls guarded by `window.self !== window.top` — no-ops outside iframe context.
- **M** `eslint.config.mjs`: `no-unused-vars` → `'warn'`, `react/prop-types` → `'warn'`; ignores expanded to cover `functions/**`, `public/**`, `vitest.config.js`; Shadcn UI stub `import/no-unresolved` suppressed per-directory.
- **M** `AuthContext.jsx`: profile-fetch retries once (1.5s delay) before showing error toast; toast includes inline "Refresh now" button.
- **Testing gap** already closed: 29 Vitest unit tests exist (`yarn test`) — pre-dates this audit comment.
- Testing: 100% pass — 12/12 scenarios + 29/29 unit tests, lint clean (iteration_28.json)

### Phase 27 - Full Security & Performance Audit (Complete — Feb 2026)
**Security fixes:**
- **S1** `firestoreService.js`: `markAllNotificationsReadRecord` now chunks writes into batches of 400 (prevents exceeding Firestore's 500-write limit)
- **S2** `AuthContext.jsx`: `updateProfile` now whitelists allowed fields (`name`, `phone`, `experience`, `bio`, `location`) — prevents users writing arbitrary data like `rating`, `role`, `games_officiated`
- **S3** `firestoreService.js`: `sendMessageRecord` and `assignReferee` notification use `serverTimestamp()` instead of client-side `new Date().toISOString()` — trustworthy ordering, not user-clock-spoofable. Added `toISOString()` normalizer for both Firestore Timestamps and ISO strings.
- **S4** `useFCM.js`: Added missing `Analytics.pushEnabled()` call when FCM token is successfully registered
- **S5** `Profile.jsx` + `Settings.jsx`: "Coming Soon" toasts now use neutral wording — removed AI-generation context ("request it in your next prompt")

**Performance fixes:**
- **P1** `useNotificationActions.js` + `useMessageActions.js`: Marking messages/notifications as read no longer triggers full `fetchData` refetch — realtime listeners handle the update
- **P2** `firestoreService.js`: Aligned initial message fetch limit to 100 (was 50) to match `useRealtimeMessages` limit(100) — eliminates duplicate fetch on mount
- **P3** `Dashboard.jsx`: All computed values (`upcomingGames`, `recentPayments`, `totalEarnings`, `pendingPayments`, `recentActivity`) wrapped in `useMemo`

**Quality / Code cleanup:**
- **Q1** `Dashboard.jsx`: Rating fallback changed from hardcoded `'4.8'` to `'N/A'`
- **Q2** `useRealtimeMessages.js`: `useEffect` syncing `usersMapRef` now has `[usersMap]` dependency (was missing)
- **Q3** Deleted dead code file `src/lib/demoDataService.js`
- **Q4** Removed unused `@supabase/supabase-js` from `package.json`
- Removed emoji characters from all toast messages in action hooks (per design guidelines)
- Updated `mappers.js` `mapMessage` to normalize Firestore Timestamps
- Extracted `toISOString` into `src/lib/timestampUtils.js` shared utility — used by `mappers.js`, `firestoreService.js`, and realtime hooks (keeps mappers pure/unit-testable)
- Cleaned up corrupted `.gitignore` (removed stray `-e` artifacts and duplicated credential blocks)
- Moved `ALLOWED_PROFILE_FIELDS` to module-level constant in `AuthContext.jsx` (avoids recreating Set per render)
- Untracked `memory/test_credentials.md` from git (`git rm --cached`)

- Testing: 100% pass — 17/17 audit items verified, 29/29 unit tests, all UI flows working (iteration_29.json)

## Test Credentials
- Manager: `manager@demo.com` / `manager123`
- Referee: `referee@demo.com` / `Referee123` (capital R)

## Prioritized Backlog

### P0 (Deploy Cloud Functions — DONE Apr 2026)
- `sendPushNotification` (v2, us-central1) — LIVE. Triggers on every new `/notifications/{id}` doc.
- Storage rules — LIVE.

### P1 (Optional Enhancement)
- Public referee profile pages

### P2 (Completed)
- ~~Context namespace refactor~~ (Phase 15)
- ~~camelCase consolidation~~ (Phase 17)

### Phase 28 - Tier 2 Package Upgrades (Complete — Feb 2026)
- **date-fns** 2.30 → 4.1.0 (21 files — no code changes needed, ESM imports compatible)
- **framer-motion** 10.18 → **motion** 12.38.0 (34 files — import path changed from `'framer-motion'` to `'motion/react'`, old package removed)
- **recharts** 2.15 → 3.8.1 (1 file — PerformanceAnalytics, standard Bar/PieChart APIs unchanged)
- **react-day-picker** 8.10 → 9.14.0 (1 file — `calendar.jsx` rewritten for v9 API: class names, `Chevron` component)
- **react-router-dom** 6.30 → **react-router** 7.14.0 (22 files — import path changed from `'react-router-dom'` to `'react-router'`, old package removed)
- Note: After upgrades, Vite dep cache must be cleared (`rm -rf node_modules/.vite`) for date-fns v4 ESM resolution
- Testing: 100% pass — all 5 upgrades verified, 29/29 unit tests, all pages + flows working (iteration_30.json)
