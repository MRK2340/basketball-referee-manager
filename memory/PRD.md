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

### Phase 31 - Backlog Items (Complete — Feb 2026)

**1. Server-side Rate Limiting (Cloud Functions)**
- `enforceMessageRateLimit`: Deletes messages exceeding 20/min per user (onDocumentCreated trigger)
- `sendPushNotification`: Skips notifications exceeding 30/min per user
- `checkRateLimit()`: Transaction-based per-user counters in `_rate_limits` collection (60s sliding window)
- `_rate_limits` collection locked from client access (`allow read, write: if false`)
- Both functions deployed to us-central1 (Node.js 22 Gen 2)

**2. Collection Pagination at Scale**
- `fetchMoreGames(managerId, afterDatetime)`: Cursor-based pagination by game_date
- `fetchMoreTournaments(managerId, afterName)`: Cursor-based pagination by name
- `PAGE_SIZE = 50` for all paginated queries
- Initial `fetchAppData` now limits games and tournaments to 100 each (was unbounded)

**3. Sentry Integration**
- `logger.ts` initializes `@sentry/react` when `VITE_SENTRY_DSN` is set (production only)
- `logger.error()` → `Sentry.captureException()` for Error objects, `captureMessage()` for strings
- `logger.warn()` → `Sentry.captureMessage()` with warning level
- `VITE_SENTRY_DSN` added to `.env.example`

**4. TypeScript Migration (Phase 1 — Core Utilities)**
- `tsconfig.json` added (strict, allowJs, bundler moduleResolution)
- **5 files migrated**: `constants.ts`, `timestampUtils.ts`, `rateLimit.ts`, `logger.ts`, `mappers.ts`
- 10 exported interfaces: `MappedProfile`, `MappedConnection`, `MappedGame`, `MappedAssignment`, `MappedTournament`, `MappedPayment`, `MappedMessage`, `MappedAvailability`, `MappedGameReport`
- 6 exported type aliases: `Role`, `GameStatus`, `AssignmentStatus`, `ConnectionStatus`, `NotificationType`, `PaymentStatus`
- All existing JS files continue to work (mixed JS/TS via Vite)

- Testing: 100% pass — all 4 items verified, 29/29 unit tests, all UI flows working (iteration_33.json)
- Deployed: Firestore rules/indexes + both Cloud Functions live

### Phase 32 - TypeScript Migration Phase 2 (Complete — Feb 2026)
**Core data layer migrated to TypeScript:**
- `firestoreService.ts` — 30+ exported functions typed with `ServiceUser`, `SafeResult<T>`, `Doc` types. Firestore SDK types (`DocumentSnapshot`, `QuerySnapshot`) used for helpers.
- `AuthContext.tsx` — Full `AuthContextValue` interface, `AppUser` type, typed login/register/resetPassword/updateProfile/uploadAvatar functions. `createContext<AuthContextValue | null>()`.
- `DataContext.tsx` — Typed provider props, `MappedProfile` used for usersMap.
- `types.ts` — Shared types: `AppUser`, `SafeResult<T>`, `NotificationPreferences`, `ServiceUser`
- Total TS files: 8 (constants, timestampUtils, rateLimit, logger, mappers, types, firestoreService, AuthContext, DataContext)
- Also deployed missing `tournaments(manager_id, name)` composite index
- Testing: 29/29 unit tests pass, Manager dashboard loads correctly, demo login flows working

### Phase 33 - TypeScript Migration Phase 3: Hooks (Complete — Feb 2026)
**15 custom hooks migrated to TypeScript:**
- `useDataFetching.ts` — Full state types (`MappedMessage[]`, `MappedProfile[]`, `AnyArr`), typed `fetchData` and `loadMoreMessages`
- `useFCM.ts` — Typed FCM token management, `AppUser` param
- `useRealtimeMessages.ts` — Typed Firestore `QuerySnapshot`, `Unsubscribe`, `Dispatch<SetStateAction<MappedMessage[]>>`
- `useRealtimeNotifications.ts` — Typed Firestore listener with `Notification` record type
- 11 action hooks typed with `(user: AppUser | null, fetchData: (...) => Promise<void>)` pattern and typed inner function params
- Skipped: `use-toast.js`, `use-mobile.jsx` (Shadcn UI internals)
- **Total TS files: 24** (was 9) | JS/JSX remaining: 135 (pages + components)
- Testing: 29/29 unit tests pass, both demo login flows working

### Phase 34 - TypeScript Migration Phase 4: Pages & Components (Complete — Feb 2026)
**78 files renamed from .jsx/.js to .tsx/.ts:**
- `App.tsx`, `main.tsx`, `ThemeContext.tsx`
- 7 lib utilities: `analytics.ts`, `conflictUtils.ts`, `demoAccounts.ts`, `exportIndependentGames.ts`, `firebase.ts`, `seedFirestore.ts`, `utils.ts`
- 13 app components: `Layout`, `TopBar`, `Sidebar`, `BottomNavigation`, `ErrorBoundary`, `LoadingSpinner`, `NotificationPanel`, `ProtectedRoute`, `PublicRoute`, `RouteTracker`, `ScrollToTop`, `SkeletonCard`, `GameDetailSheet`
- 18 top-level pages: `Dashboard`, `Login`, `Register`, `Profile`, `Messages`, `Calendar`, `Schedule`, `Settings`, `Manager`, `Games`, `Payments`, `PerformanceAnalytics`, `GameReport`, `FindManagers`, `HomePage`, `LandingPage`, `AboutPage`, `ContactPage`, `NotFound`
- 40+ page sub-components across Calendar/, Manager/, Schedule/, Settings/, Games/
- **Intentionally skipped:** 57 Shadcn UI vendor components in `components/ui/` (`.jsx` — upstream compatibility)
- **Final count: 102 TS/TSX files | 57 JS/JSX (Shadcn only)**
- Testing: 100% pass — all pages render, navigation works, 29/29 unit tests, no TS compilation errors (iteration_34.json)

### Phase 35 - Future/Backlog Complete (Complete — Feb 2026)

**1. Public Referee Profile Pages (P1)**
- New `/referee/:id` route — no auth required, shows name, avatar, location, bio, rating, games, experience, certifications
- Private data (email, phone, FCM token) excluded from `fetchPublicRefereeProfile`
- "Share Public Profile" button on Profile page (copies URL to clipboard, referee-only)
- Firestore rules updated: referee profiles readable publicly (`resource.data.role == 'referee'`)
- Referee ratings collection now publicly readable for profile display

**2. Stricter Prop Types**
- 13 app components typed: ProtectedRoute, PublicRoute, Layout, Sidebar, TopBar, LoadingSpinner, NotificationPanel, SkeletonCard, GameDetailSheet, ErrorBoundary, AccountSecuritySettings, etc.
- Interfaces: `ProtectedRouteProps`, `NotificationPanelProps`

**3. Audit Logging**
- `writeAuditLog(userId, action, target, details)` function in firestoreService.ts
- Wired to login, profile updates, referee assignments
- `_audit_log` Firestore collection: append-only (create: if isAuth(); read/update/delete: if false)

**4. GDPR Data Export/Deletion**
- "Export My Data" button in Settings → downloads JSON with all user data (profile, messages, assignments, reports, ratings, availability, connections, payments)
- "Delete Account" button → double-confirmation → deletes all data across 8 collections + user profile → auto-logout
- `exportUserData` and `deleteUserData` functions in firestoreService.ts

**5. Two-Factor Authentication**
- TwoFactorDialog component: password → QR code → verify → done flow
- Uses Firebase `TotpMultiFactorGenerator` for TOTP enrollment
- MFA challenge handling in login: catches `auth/multi-factor-auth-required`, shows TOTP verification
- `mfaResolver` and `verifyMFA` exposed in AuthContext
- Note: Requires Firebase Identity Platform enabled in Firebase Console

- Deployed: Updated Firestore rules (public referee reads, audit log, ratings)
- Testing: All 5 items verified, 29/29 unit tests pass (iteration_35.json)

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

### Phase 29 - Tier 1 Package Upgrades (Complete — Feb 2026)
- **Vite** 4.5 → 8.0.8 (Rolldown Rust bundler replaces esbuild/Rollup, `@vitejs/plugin-react` 4→6.0.1)
- **TailwindCSS** 3.4 → 4.2.2 (CSS-first config: `tailwind.config.js` removed, `@theme` directives in `index.css`, `@tailwindcss/postcss` replaces PostCSS plugin, `autoprefixer` removed, `tailwindcss-animate` migrated to `@plugin`)
- **React** 18.3 → 19.2.5 + **react-dom** 19.2.5 (new ref handling, improved concurrent rendering)
- **react-helmet** → **react-helmet-async** 3.0.0 (20 files updated, `HelmetProvider` wrapper added in App.jsx)
- **@types/react** 18→19.2.14, **@types/react-dom** 18→19.2.3
- Note: After TW4 migration, Vite dep cache must be cleared (`rm -rf node_modules/.vite`)
- Testing: 100% pass — all 3 upgrades verified, brand colors intact, dark mode working, 29/29 unit tests (iteration_31.json)

### Phase 30 - Code Audit Remediation (Complete — Feb 2026)
**HIGH:**
1. **Password reset flow** — `sendPasswordResetEmail` added to AuthContext. "Forgot password?" link on Login page, "Reset Password" button on Profile page (replaces "Change Password — Coming Soon")
2. **Email verification** — `sendEmailVerification` called after registration. Toast updated to "A verification email has been sent"
3. **Real-time listener error recovery** — Both `useRealtimeNotifications` and `useRealtimeMessages` now show "sync lost" toast on auth expiry/error instead of silent failure

**BUGS:**
4. **Null guard in handleForward()** — `Messages.jsx` checks `recipientOptions.length === 0` before forwarding; shows error toast if empty
5. **Stale data on fetch error** — `useDataFetching` clears all state arrays on initial load failure
6. **Vite error overlay production guard** — Debug scripts only injected when `isDev` is true

**MEDIUM:**
7. **Input validation** — AddGameDialog: payment 0–10000 + time format regex. Messages: content max 5000, subject max 200
8. **Firestore rules bounds** — Payments: `amount >= 0 && amount <= 10000`. Ratings: `stars >= 1 && stars <= 5`
9. **CSP headers** — `firebase.json` hosting config: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
10. **Production-safe logging** — `lib/logger.js` utility (silent in prod, verbose in dev). 14 `console.error` calls replaced; only 2 remain in main.jsx (DEV-guarded + fatal)

- Testing: 100% pass — all 10 items verified, 29/29 unit tests, all UI flows working (iteration_32.json)


### Phase 36 - Schedule Import Features (Complete — Apr 2026)

**Feature 1: Universal Schedule Import (Referee)**
- "Import Schedule" button in Independent Log tab on Games page
- Drag-and-drop file upload supporting CSV, Excel (.xlsx), and PDF formats
- Auto-detects column headers from ArbiterSports, GameOfficials, Assigning.net exports
- Preview table with checkboxes showing past/future classification
- Past games → batch written to `independent_games` collection
- Future dates → batch written to `referee_availability` collection
- Success screen with counts (games logged + availability dates)
- Libraries: `papaparse` (CSV), `xlsx` (Excel), `pdfjs-dist` (PDF)

**Feature 2: Manager Bulk Game Schedule Import**
- "Bulk Import Games" button on Tournaments tab in Manager hub
- CSV and Excel file upload with column auto-detection
- Tournament selection step: pick existing tournament OR create new one
- New tournament creation with name, location, courts, date range
- Preview table showing all parsed games with checkboxes
- Batch writes games to Firestore `games` collection under selected tournament
- Success screen with game count

**New files:**
- `src/lib/scheduleImportParsers.ts` — Parsing engine (CSV/Excel/PDF, column detection, date/time normalization)
- `src/pages/Games/ScheduleImportDialog.tsx` — Referee import dialog (4-step wizard)
- `src/pages/Manager/BulkGameImportDialog.tsx` — Manager import dialog (5-step wizard)

**Modified files:**
- `src/lib/firestoreService.ts` — Added `batchImportRefereeSchedule()` and `batchImportManagerGames()` batch write functions
- `src/pages/Games/IndependentGamesTab.tsx` — Added Import Schedule button
- `src/pages/Manager/TournamentsTab.tsx` — Added Bulk Import Games button

- Testing: 100% pass — all 12 test cases verified (iteration_36.json)


### Phase 37 - Import Enhancements (Complete — Apr 2026)

**Enhancement 1: Downloadable CSV Templates**
- "Download CSV Template" button in both import dialogs (referee + manager)
- Templates include sample rows with correct headers for ArbiterSports/GameOfficials/Assigning.net
- Functions: `downloadRefereeTemplate()`, `downloadManagerTemplate()` in `scheduleImportParsers.ts`

**Enhancement 2: Duplicate Detection**
- Referee: Checks `independent_games` for matching date + organization before import
- Manager: Checks `games` for matching tournament + date + home_team + away_team
- Duplicate rows show amber "Duplicate" badge in preview table
- Duplicates are auto-deselected (user can re-select if desired)
- Warning banner: "X duplicates detected — matching games already in your log were auto-deselected"
- Functions: `checkRefereeDuplicates()`, `checkManagerDuplicates()` in `firestoreService.ts`

**Enhancement 3: Import History & Undo**
- `_import_history` Firestore collection stores import records (user_id, type, file_name, created IDs)
- `ImportHistoryPanel` component: collapsible "Import History" section with past imports
- Each import shows file name, timestamp, record counts, and "Undo" button
- Undo confirmation dialog → batch-deletes all records from that import
- History write is best-effort (non-blocking) — import succeeds even if history write fails
- Functions: `fetchImportHistory()`, `undoImport()` in `firestoreService.ts`

**Firestore updates:**
- `firestore.rules`: Added `_import_history` collection rules (user CRUD on own records)
- `firestore.indexes.json`: Added composite index for `_import_history(user_id, created_at)`
- **Deploy required**: `firebase deploy --only firestore:rules,firestore:indexes`

- Testing: 10/12 pass (iteration_37.json). 2 INFO items require Firestore rules deployment for full undo testing.


### Phase 38 - AI Manager Assistant (Complete — Apr 2026)

**Feature 3: AI Manager Assistant (Gemini 2.5 Pro)**
- Floating sparkle button (FAB) on Manager page — opens slide-in chat panel
- Powered by Firebase AI Logic (Vertex AI in Firebase) with Gemini 2.5 Pro
- Natural language → structured function calls → preview → execute
- System prompt injects current context (tournaments, games, referees with IDs)
- Resolves relative dates ("this Saturday"), team names, tournament references

**Supported actions via function calling:**
1. `create_games` — Single games, doubleheaders, batch creation
2. `create_tournament` — Full tournament creation
3. `assign_referee` — Assign referee to game by name
4. `update_game` — Change time, venue, payment
5. `cancel_games` — Delete games
6. `complete_games` — Mark games as completed

**UI Features:**
- Slide-in panel (420px) with backdrop overlay
- Chat history with user (blue) / assistant (gray) message styling
- Action cards with confirm/skip buttons before execution
- Loading state with "Thinking..." animation
- Error handling for Vertex AI not-enabled state
- Only visible to manager role (not referees)

**New files:**
- `src/lib/aiAssistant.ts` — AI service (model init, function declarations, system prompt builder, response parser)
- `src/components/AIAssistantPanel.tsx` — Chat panel UI component

**Modified files:**
- `src/pages/Manager/index.tsx` — Added FAB button and AI panel

- Testing: 100% pass — 12/12 test cases verified (iteration_38.json)
- Vertex AI enabled and Gemini 2.5 Pro responding to messages


### Phase 39 - Firestore Deployment + Performance Monitoring (Complete — Apr 2026)

**Task 1: Firestore Rules & Indexes Deployment**
- Deployed `_import_history` collection rules (user CRUD on own records)
- Deployed composite index for `_import_history(user_id, created_at desc)`
- Import History + Undo now fully functional end-to-end
- Command: `firebase deploy --only firestore:rules,firestore:indexes --token <CI_TOKEN>`

**Task 2: Firebase Performance SDK**
- Added `getPerformance()` to `firebase.ts` — auto-collects page load, network requests, route changes
- Created `src/lib/performanceTraces.ts` — custom trace utilities (`startTrace`, `stopTrace`, `traceAsync`)
- Instrumented key flows:
  - `fetch_app_data` — traces full data load on login/refresh
  - `ai_assistant_response` — traces Gemini 2.5 Pro response latency
- Performance data visible in Firebase Console → Performance tab
- SDK initializes safely (try/catch for non-browser environments)

**Modified files:**
- `src/lib/firebase.ts` — Added `getPerformance()` export
- `src/hooks/useDataFetching.ts` — Wrapped `fetchAppData` in `traceAsync`
- `src/lib/aiAssistant.ts` — Wrapped Gemini call in `traceAsync`

**New files:**
- `src/lib/performanceTraces.ts` — Custom trace helpers

- Verified: Import history working with Undo, Performance SDK auto-collecting


### Phase 40 - AI Backlog Features (Complete — Apr 2026)

**1. AI Chat History Persistence**
- Chat messages saved to `_ai_chat_history` Firestore collection (per user, last 50 messages)
- Auto-loads previous conversation when reopening the AI panel
- "New Chat" button in header clears conversation and starts fresh
- Debounced save (1s) to avoid excessive writes
- Firestore rules: `_ai_chat_history/{userId}` — user-only read/write

**2. AI-Powered Auto-Assign After Bulk Import**
- "Auto-Assign Referees" button appears on bulk import done step
- Algorithm: queries connected referees, availability, and existing assignments
- Scoring: availability (+50), rating (*5), load balancing (-15 per existing assignment)
- Review panel with checkboxes → confirm → batch assign
- Shows info message if no connected referees found

**3. Voice Input for AI Assistant**
- Microphone button next to text input (outline icon → red pulse when active)
- Uses Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Browser-native — no API key needed (Chrome, Edge, Safari)
- Interim results fill the input field in real-time
- Hidden when browser doesn't support Speech API

**New files:**
- `src/components/AutoAssignPanel.tsx` — Auto-assign suggestion UI with confirm/cancel
- Firestore functions: `saveAIChatHistory`, `loadAIChatHistory`, `clearAIChatHistory`, `generateAutoAssignSuggestions`

**Modified files:**
- `src/components/AIAssistantPanel.tsx` — Chat persistence, voice input, new chat button
- `src/pages/Manager/BulkGameImportDialog.tsx` — Auto-assign panel on done step
- `src/lib/firestoreService.ts` — Added 4 new functions
- `firestore.rules` — Added `_ai_chat_history` collection rules (deployed)

- Testing: 100% pass — 8/8 test cases verified (iteration_39.json)


### Phase 41 - P2 Features Complete (Complete — Apr 2026)

**1. Offline-First Support (Firestore Persistence)**
- `enableIndexedDbPersistence()` enabled on Firestore init — reads from IndexedDB cache when offline
- Queued writes auto-sync when reconnected
- `OfflineIndicator` component: amber banner "You're offline — changes will sync when reconnected"
- Green "Back online — syncing changes" banner on reconnect (auto-dismisses after 3s)
- Graceful error handling for multi-tab and unsupported browsers

**2. Push Notification Scheduling for Game Reminders**
- `scheduleGameReminder` Cloud Function: triggers on `game_assignments` document creation
- Creates 24h and 1h reminder entries in `_game_reminders` Firestore collection
- `processGameReminders` Cloud Function: runs every 15 minutes via Cloud Scheduler
- Checks for due reminders, sends FCM push + in-app notification to referees
- Respects user notification preferences (pushNotifications, scheduleChanges)
- Auto-cleans invalid FCM tokens
- Firestore rules: `_game_reminders` server-only (admin SDK bypasses rules)

**3. Mobile-Responsive UI Refinements**
- Manager tabs: icon-only on mobile (<640px), icons + labels on desktop (>=640px)
- Horizontal scroll for tabs with hidden scrollbar (`no-scrollbar` CSS utility)
- AI FAB button: `bottom-20` on mobile (above bottom nav), `bottom-6` on desktop
- Messages page: `h-auto lg:h-[70vh]` for proper stacking on mobile
- Dashboard stats: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
- All pages properly responsive down to 390px viewport

**New files:**
- `src/components/OfflineIndicator.tsx` — Offline/online indicator
- CSS: `.no-scrollbar` utility in `index.css`

**Modified files:**
- `src/lib/firebase.ts` — Added `enableIndexedDbPersistence`
- `src/App.tsx` — Added `OfflineIndicator` component
- `functions/index.js` — Added `scheduleGameReminder` + `processGameReminders`
- `src/pages/Manager/index.tsx` — Mobile-responsive tabs, FAB positioning
- `src/pages/Messages.tsx` — Height fix for mobile
- `firestore.rules` — Added `_game_reminders` collection (server-only)

**Deployed:**
- Firestore rules (via Firebase CLI with CI token)
- Cloud Functions: `scheduleGameReminder`, `processGameReminders`

- Testing: 100% pass — 12/12 test cases verified (iteration_40.json)

---

## ALL P2 BACKLOG COMPLETE
The iWhistle application is now feature-complete with all planned P0, P1, and P2 items shipped:
- Phases 1-35: Core app, TypeScript migration, security hardening, package upgrades, code audit

### Bug Fix — Auto-Reload Issue (Fixed — Apr 2026)

**Root Cause:** Firebase Auth periodically refreshes tokens (~1hr), firing `onAuthStateChanged`. Each callback created a **new user object** via `buildUser()`, even when data was identical. This cascaded:
1. `setUser(newObj)` → new user reference
2. DataContext `useEffect([user, fetchData])` triggers (both deps changed)
3. `fetchData(true)` → sets `loading = true` → full loading spinner → refetches all data → `loading = false`
4. **Result:** Page unmounts/remounts while user is reading

**Fix applied to 3 files:**
1. **AuthContext.tsx** — `stableSetUser()`: Compares key fields (id, name, email, role, avatar, rating) before calling `setUser`. Skips if unchanged.
2. **DataContext.tsx** — Changed `useEffect([user, fetchData])` → `useEffect([user?.id])` with ref tracking. Only triggers on actual user ID change.
3. **useDataFetching.ts** — `fetchData` now uses `userRef` instead of `user` in its closure. `useCallback([])` — stable, never recreated.

- Verified: Page stable for 10+ seconds with no reload/flash

- Phase 36: Schedule Import (CSV/Excel/PDF)

### Bug Fix — Page Auto-Reload Issue (FIXED — Apr 2026)

**Root Cause:** The Kubernetes proxy/ingress terminates idle WebSocket connections after ~30-60 seconds. Vite's HMR client detects the dropped connection → polls `/__vite_ping` → when the server responds → calls `location.reload()`. This causes a full page reload every 30-60 seconds while the user is reading.

**Fix (two-part):**
1. **React-level stabilization** (Phase earlier):
   - `AuthContext.tsx` — `stableSetUser()` prevents unnecessary re-renders on auth token refresh
   - `DataContext.tsx` — Effect depends on `user?.id` instead of full `user` object
   - `useDataFetching.ts` — `fetchData` uses `userRef` for stable callback

2. **Vite client patch** (this fix):
   - Patched `node_modules/vite/dist/client/client.mjs` line 974
   - Replaced `location.reload()` in the WS disconnect handler with `console.debug('[vite] reconnected after WS drop — skipping reload')`
   - Also added `server.hmr.timeout: 120000` and `server.hmr.overlay: false` in `vite.config.js`
   - Server-side WebSocket keepalive plugin sends pings every 15s
   - Client-side fetch keepalive pings `/__vite_ping` every 20s
   - Postinstall script at `scripts/patch-vite-client.sh` re-applies patch after `yarn install`

- Verified: Page survived 100+ seconds with ZERO reloads — WS dropped and reconnected silently

- Phase 37: Import enhancements (templates, duplicates, history/undo)
- Phase 38: AI Manager Assistant (Gemini 2.5 Pro)
- Phase 39: Firestore deployment + Performance monitoring
- Phase 40: AI backlog (chat persistence, auto-assign, voice input)
- Phase 41: P2 completion (offline-first, push reminders, mobile UI)


### Phase 42 - Referee AI Assistant + Tournament Bracket Editor (Complete — Apr 2026)

**Feature 1: AI Assistant for Referees**
- Sparkle FAB on referee Dashboard only (not visible to managers)
- Slide-in panel with Gemini 2.5 Pro (same UX as manager panel)
- Referee-specific function declarations: query_schedule, check_availability, set_availability, query_earnings, send_message, log_game
- System prompt includes referee's games, availability, earnings, manager contacts
- Chat persistence to Firestore (`_ai_chat_history/{userId}_referee`)
- Voice input (Web Speech API), New Chat button
- All actions preview before execution with confirm/skip

**Feature 2: Real-Time Collaborative Tournament Bracket Editor**
- New "Brackets" tab in Manager page
- Tournament selector dropdown
- Create Bracket dialog: format (single/double elimination, round-robin), teams (one per line)
- Visual bracket tree: horizontal layout with rounds as columns
- Real-time sync via Firestore `onSnapshot` — multiple users see changes instantly
- "Live Sync" badge indicator
- Set Score inline editor on each match
- Winner advancement: completing a match auto-fills the next round
- Supports all 3 formats:
  - Single Elimination: standard bracket tree with seeding
  - Double Elimination: winners bracket + losers bracket + grand final
  - Round Robin: grid of all matchups across rounds
- Firestore collection: `tournament_brackets`

**New files:**
- `src/lib/refereeAiAssistant.ts` — Referee AI service with function declarations
- `src/components/RefereeAIPanel.tsx` — Referee AI chat panel
- `src/lib/bracketUtils.ts` — Bracket generation (single/double elim, round-robin)
- `src/pages/Manager/BracketEditor.tsx` — Bracket editor with real-time sync

**Modified files:**
- `src/pages/Dashboard.tsx` — Referee AI FAB + panel
- `src/pages/Manager/index.tsx` — Brackets tab + tournament selector
- `src/lib/firestoreService.ts` — saveBracket, loadBracket, deleteBracket
- `firestore.rules` — `tournament_brackets` collection rules (deployed)

- Testing: 100% pass — iteration_43.json (both features verified)


### Phase 43 - Privacy Settings + Help Center (Complete — Apr 2026)

**Privacy Settings:**
- Dialog at Settings > Account & Security > Privacy Settings
- 4 toggles: Public Profile, Show Email, Show Rating, Show Availability
- Saves to Firestore `users/{uid}` as `privacy_*` fields
- Defaults: profile public=true, email=false, rating=true, availability=true

**Help Center:**
- Dedicated page at `/help` route (protected, requires login)
- 7 FAQ sections: Getting Started, Schedule & Games, Tournaments & Brackets, Payments & Earnings, AI Assistant, Account & Security, Notifications
- Collapsible Q&A items with smooth animation
- "Contact Support" link to /contact page
- Linked from Settings > Support > Help Center button

**Remaining "Coming Soon" buttons (future backlog):**
Login History, Contact Support, Send Feedback, all Payment page buttons (Settings/Direct Deposit/Tax Docs/Receipts), Profile Notification Settings, Calendar Sync, Games Manage Live/View Report, Manager Referee Management View Profile/Send Message

**New files:** `src/pages/Settings/PrivacySettingsDialog.tsx`, `src/pages/HelpCenter.tsx`
**Modified:** `src/pages/Settings.tsx`, `src/App.tsx`

### Phase 44 - Security & Code Quality Hardening (Complete — Apr 2026)

**8 code review items addressed:**

1. **Firestore rules: tournament_brackets restricted to owner** — `update, delete` require `request.auth.uid == resource.data.manager_id`. `saveBracket()` now writes `manager_id` field. Deployed.

2. **Integration tests added** — 22 new tests in `src/__tests__/integration.test.js` covering validation, schedule import parsing, and bracket generation. Total: 51/51 passing.

3. **SDK errors mapped to safe messages** — New `sanitizeError()` function in `firestoreService.ts` maps Firebase error codes (permission-denied, not-found, unauthenticated, resource-exhausted, etc.) to user-friendly messages. Raw `error.message` never exposed.

4. **Recipient ID validation** — `sendMessageRecord()` now validates: non-empty string, not self-send, recipient exists in Firestore. Also validates message content length (5000 char max).

5. **IndexedDB persistence failure logging** — `firebase.ts` now logs `console.warn()` with specific messages for `failed-precondition` (multi-tab) and `unimplemented` (no IndexedDB) cases instead of silently swallowing.

6. **ESLint import/no-cycle rule** — Confirmed disabled (`'off'`) since TypeScript compiler handles cycle detection. Updated comment to explain why.

7. **Babel devDependencies** — Investigated: `@babel/generator`, `@babel/parser`, `@babel/traverse`, `@babel/types` are used by Emergent platform visual editor plugins (`ast-utils.js`, `vite-plugin-react-inline-editor.js`). Cannot remove.

8. **Client-side input validation** — New `src/lib/validation.ts` with `validateRequired`, `validateDate`, `validateTime`, `validateNumber`, `validateEmail`, `validateOptional`, `validate` (combiner). Applied to `addTournament`, `addGameRecord`, `sendMessageRecord`.

**New files:** `src/lib/validation.ts`, `src/__tests__/integration.test.js`

**Dependency added:** `@radix-ui/react-switch` (for Switch component)


### Phase 45 - Server-Side RBAC Enforcement (Complete — Apr 2026)

**Security vulnerability: RBAC was enforced only on the client side** — `user.role !== 'manager'` checks in frontend hooks/service functions could be bypassed via browser console state patching.

**Fix: Hardened 12 Firestore security rules with server-side RBAC using `isManager()`/`isReferee()` + ownership validation + field-level restrictions:**

| Collection | Gap Fixed | Rule Added |
|---|---|---|
| `game_assignments` create | No ownership validation, no status constraint | Manager: `manager_id == auth.uid`. Referee: `referee_id == auth.uid && status == 'pending'` |
| `game_assignments` update | Referee could modify any field | Referee restricted to `status` + `decline_reason` only via `changedFields().hasOnly()` |
| `tournament_brackets` create | `isAuth()` allowed referees | Changed to `isManager() && manager_id == auth.uid` |
| `messages` create | No `sender_id` validation | `sender_id == auth.uid && auth.uid in participants` |
| `game_reports` update | Both roles could update any field | Referee: cannot touch resolution fields. Manager: can only write resolution fields + status |
| `manager_connections` update | Referee could self-approve | Restricted to `isManager() && manager_id == auth.uid` |
| `tournaments` create | No ownership check | Added `manager_id == auth.uid` |
| `games` create | No ownership check | Added `manager_id == auth.uid` |
| `payments` create | No ownership check | Added `manager_id == auth.uid` |
| `referee_ratings` create | No ownership check | Added `manager_id == auth.uid` |
| `referee_availability` create | Relied on `resource == null` | Added `referee_id == auth.uid` |
| `_audit_log` create | No ownership check | Added `user_id == auth.uid` |

**Additional improvements:**
- Added `changedFields()` helper function to Firestore rules for field-level update restrictions
- Normalized all 22 client-side role-check error messages to use `permission-denied` prefix for consistent `sanitizeError()` mapping
- `saveBracket()` now requires `managerId` parameter (non-optional)
- Updated test assertions to match sanitized error message format
- 98/98 Vitest tests passing

**Deploy required:** Paste `/app/firestore.rules` into Firebase Console > Firestore > Rules > Publish
**Files modified:** `firestore.rules`, `src/lib/firestoreService.ts`, `src/__tests__/firestoreService.test.js`


### Phase 46 - Pagination, Error Context & Persistence Feedback (Complete — Apr 2026)

**Issue 8: No pagination — queries hard-capped at 100 with no cursor continuation**
- `fetchAppData` now returns `hasMoreGames`, `hasMoreTournaments`, `hasMoreMessages`, `hasMoreNotifications` flags (true when initial page is full)
- Added `fetchMoreNotifications(userId, afterTimestamp)` cursor-based pagination function
- Updated `fetchMoreGames` and `fetchMoreTournaments` to return mapped items (not raw docs) + `hasMore` flag
- Updated `fetchMoreMessages` to return `{ items, hasMore }` instead of flat array
- `useDataFetching.ts` now tracks `hasMore*` state for games, tournaments, messages, notifications + exposes `loadMore*` callbacks
- `DataContext.tsx` exposes all 4 `hasMore*` flags and `loadMore*` callbacks
- UI: "Load more tournaments" button on TournamentsTab, "Load older notifications" button in NotificationPanel, existing Messages "Load more" button updated for new response format
- `INITIAL_PAGE = 100` constant replaces magic numbers

**Issue 9: IndexedDB persistence failures silently ignored**
- `firebase.ts` now exports `getPersistenceStatus()` async function returning `'enabled' | 'multi-tab' | 'unsupported' | 'error'`
- `OfflineIndicator.tsx` checks persistence status on mount and shows a dismissable toast banner:
  - "Offline mode unavailable — another tab is open" (multi-tab)
  - "Offline mode unavailable — browser not supported" (unsupported)
  - "Offline mode failed to initialize" (error)
  - Auto-dismisses after 6 seconds

**Issue 10: Generic Firestore error wrapper discards error context**
- `SafeResult` error type upgraded from `{ message: string }` to `FirestoreError { message, code, retryable }`
- New `extractErrorCode(err)` extracts Firebase error code from SDK `.code` property, message prefix, or keyword scan. Normalizes to lowercase kebab-case.
- `sanitizeError` refactored from string scanning to code-based switch statement
- `safeHandle` now returns `{ code, retryable }` alongside the sanitized message
- `RETRYABLE_CODES` set: `unavailable`, `resource-exhausted`, `deadline-exceeded`, `aborted`, `internal`
- Callers can now conditionally retry: `if (error.retryable) { /* retry */ }`

**Files modified:** `src/lib/types.ts`, `src/lib/firestoreService.ts`, `src/lib/firebase.ts`, `src/hooks/useDataFetching.ts`, `src/contexts/DataContext.tsx`, `src/components/OfflineIndicator.tsx`, `src/components/NotificationPanel.tsx`, `src/pages/Manager/TournamentsTab.tsx`, `src/pages/Manager/index.tsx`
- 98/98 Vitest tests passing


### Phase 47 - Sync Conflict Resolution & TypeScript `any` Elimination (Complete — Apr 2026)

**Issue: No sync conflict resolution — offline edits use last-write-wins with no merge strategy or user notification**
- Created `useSyncStatus.ts` hook — monitors Firestore `onSnapshot` with `{ includeMetadataChanges: true }` on `game_assignments` and `tournaments` collections
- Tracks `hasPendingWrites` metadata transitions to detect:
  - **Queued writes**: amber banner "N pending changes — will sync when online"
  - **Sync completion**: green banner "All changes synced" when offline writes commit
  - **Server conflicts**: red banner "Data was modified by another session while you were offline" when server version differs from local during reconnect
- Created `SyncStatusIndicator.tsx` component with animated pending/synced/conflict banners
- `SyncMonitor` wired into `App.tsx` inside AuthProvider tree
- Manager-specific: tournaments also monitored with per-tournament "Tournament updated" toasts

**Issue: 35+ uses of `any` type — undermines TypeScript safety across hooks and contexts**
- Reduced `any` usages from **35+ to 2** (only `Doc = Record<string, any>` in firestoreService/mappers for raw Firestore DocumentData)
- Added 8 new interfaces to `types.ts`: `AppNotification`, `RefereeRating`, `IndependentGame`, `RefereeWithAvailability`, `AppData`, `DataContextValue`, `IconComponent`, `RegisterData`, `ProfileUpdates`
- `useDataFetching.ts`: all 14 state variables now use proper types (`MappedGame[]`, `MappedPayment[]`, `AppNotification[]`, etc.)
- `DataContext.tsx`: context value typed as `DataContextValue` (was `AnyRecord`)
- `useRealtimeNotifications.ts`: `AppNotification` replaces `Record<string, any>`
- `useRealtimeMessages.ts`: `RawMessageDoc` interface replaces `Doc`
- `NotificationPanel.tsx`: `AppNotification` replaces `notification: any`
- `GameDetailSheet.tsx`: `MappedGame | null` + `MappedGameReport` + `LucideIcon` replace `any` props
- `TwoFactorDialog.tsx`: `TotpSecret` replaces `any`
- `refereeAiAssistant.ts`: `MappedAvailability[]`, `MappedPayment[]`, `IndependentGame[]` replace `AnyArr`
- `AuthContext.tsx`: `RegisterData` + `ProfileUpdates` interfaces replace `Doc`

**New files:** `src/hooks/useSyncStatus.ts`, `src/components/SyncStatusIndicator.tsx`
**Modified:** `src/lib/types.ts`, `src/hooks/useDataFetching.ts`, `src/contexts/DataContext.tsx`, `src/contexts/AuthContext.tsx`, `src/hooks/useRealtimeNotifications.ts`, `src/hooks/useRealtimeMessages.ts`, `src/components/NotificationPanel.tsx`, `src/components/GameDetailSheet.tsx`, `src/pages/Settings/TwoFactorDialog.tsx`, `src/lib/refereeAiAssistant.ts`, `src/App.tsx`
- 98/98 Vitest tests passing


### Phase 48 - Production Deployment Prep (Complete — Apr 2026)

**Deployment readiness for Emergent Native:**
- Created `/app/backend/server.py` — minimal FastAPI health check endpoint (`/api/health`) on port 8001
- Created `/app/backend/requirements.txt` with production dependencies
- Created `/app/backend/.env` with required `MONGO_URL` and `DB_NAME` keys
- Production build verified: `yarn build` completes in ~3s, outputs optimized chunks to `dist/`
- Cleaned `.gitignore` — removed 15 malformed `-e` entries
- All supervisor processes running: backend (8001), frontend (3000), mongodb

**Deployment checklist:**
- Backend health: `/api/health` returns `{"status":"ok"}` ✅
- Frontend serves: `http://localhost:3000` returns HTML ✅
- Build succeeds: `yarn build` → `dist/` ✅
- No hardcoded secrets ✅
- All Firebase config in `.env` ✅
- 98/98 Vitest tests passing ✅
- Deployment agent status: **READY** ✅


### Phase 49 - Security Hardening Round 2 (Complete — Apr 2026)

**Issue 1: Tournament brackets Firestore rule** — `update, delete` changed from `isAuth()` to `isManager()` + ownership check. Only the manager who created a bracket can modify or delete it. Rules deployed to Firebase.

**Issue 2: Avatar URL seeds user email** — Registration now seeds avatar with `fbUser.uid` instead of `userData.email`, preventing email enumeration via Dicebear avatar URLs.

**Issue 3: FCM tokens stored plaintext in user profiles** — Moved FCM tokens from `users/{uid}.fcmToken` to private `_fcm_tokens/{userId}` collection. Rules: user-only create/update, no client read (Cloud Functions use Admin SDK). Updated `useFCM.ts` (client write), `sendPushNotification` and `processGameReminders` Cloud Functions (server read). Invalidated token cleanup also moved to `_fcm_tokens`.

**Issue 4: Raw Firebase SDK errors leak** — `AuthContext.tsx:uploadAvatar` now returns sanitized error messages instead of raw `error.message`. `useFCM.ts:enablePushNotifications` now shows generic "Could not register" instead of raw SDK error.

**Deploy required:** Cloud Functions update — `firebase deploy --only functions` (FCM token migration)
**Firestore rules deployed:** ✅ (brackets + `_fcm_tokens` collection)
**Files modified:** `firestore.rules`, `src/contexts/AuthContext.tsx`, `src/hooks/useFCM.ts`, `functions/index.js`
- 98/98 Vitest tests passing


### Phase 50 - Auth Race Condition Fix (Complete — Apr 2026)

**Babel devDependencies:** Investigated — `@babel/generator`, `@babel/parser`, `@babel/traverse`, `@babel/types` are actively used by Emergent platform visual editor plugins (`vite-plugin-react-inline-editor.js`, `ast-utils.js`). Already `devDependencies`, excluded from production via `rollupOptions.external`. **Cannot remove.**

**Auth state race condition:** `stableSetUser` previously compared only 6 hardcoded fields (`id`, `name`, `email`, `role`, `avatarUrl`, `rating`). Profile updates to `bio`, `location`, `phone`, `fcmToken`, notification preferences, etc. were silently dropped when `onAuthStateChanged` fired (token refresh). **Fixed:** Replaced field-by-field comparison with `JSON.stringify` deep equality. Now catches ANY field change while maintaining the render-skip optimization for token refresh cycles where nothing actually changed.

**Files modified:** `src/contexts/AuthContext.tsx`
- 98/98 Vitest tests passing
