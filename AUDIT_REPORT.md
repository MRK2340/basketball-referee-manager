# Basketball Referee Manager — Codebase Audit Report

**Date:** 2026-04-11  
**Auditor:** Claude (AI Code Review)  
**Branch:** `claude/audit-codebase-v16Lz`

---

## Executive Summary

**Project:** React/Vite SPA for managing AAU youth basketball leagues  
**Tech Stack:** React 18, Vite, Firebase (Auth + Firestore), Tailwind CSS, Radix UI  
**Codebase Size:** ~147 source files (JS/JSX), ~6,000+ lines  
**Overall Risk Level:** MEDIUM — Several critical security issues must be resolved before production

---

## Critical — Fix Immediately

### C1: Hardcoded Demo Passwords in Client Code
- **File:** `src/pages/Login.jsx:53`
- **Issue:** Demo account passwords are hardcoded in client-side JavaScript
  ```javascript
  const demoPassword = role === 'manager' ? 'manager123' : 'Referee123';
  ```
- **Impact:** Anyone reading the source code (or minified bundle) can access demo accounts
- **Fix:** Store credentials in environment variables; never hardcode passwords

### C2: No Environment Variable Validation
- **File:** `src/lib/firebase.js:7-13`
- **Issue:** Firebase config reads from `import.meta.env.*` with no existence checks
- **Impact:** App silently fails or crashes with no helpful message when env vars are missing
- **Fix:** Validate all required `VITE_FIREBASE_*` vars on startup with descriptive errors

### C3: Test Credentials Stored in Repository
- **File:** `memory/test_credentials.md`
- **Issue:** Firebase project ID and test account credentials committed to version control
- **Impact:** Anyone with repo access can access the Firebase project
- **Fix:** Delete file, add to `.gitignore`, rotate exposed credentials

---

## High Priority

### H1: N+1 Firestore Query Pattern
- **File:** `src/lib/firestoreService.js:160-168`
- **Issue:** Referee game assignments are fetched in a loop — one read per game
  ```javascript
  const gPromises = gameIds.map(id => getDoc(doc(db, 'games', id)));
  ```
- **Impact:** 20 assignments = 20+ individual Firestore reads (latency + cost)
- **Fix:** Use `where(documentId(), 'in', gameIds)` batch query

### H2: Weak Input Validation on Forms
- **File:** `src/pages/Register.jsx`
- **Issue:** Phone number regex is overly permissive (`/^\+?[\d\s-]{10,}$/`); no email normalization
- **Fix:** Use stricter validation; normalize inputs before writing to Firestore

### H3: Unhandled Promise Rejections in DataContext
- **File:** `src/contexts/DataContext.jsx:80-90`
- **Issue:** `fetchData()` is called fire-and-forget after mutations — failures are silent
- **Fix:** Await the call and handle errors with user-facing feedback

### H4: Unrestricted Notification Creation in Firestore Rules
- **File:** `firestore.rules:85`
- **Issue:** `allow create: if isAuth()` — any authenticated user can create notifications for anyone
- **Impact:** User A can spam User B with fake notifications
- **Fix:** Restrict notification creation to Cloud Functions only (server-side)

---

## Medium Priority

### M1: O(n²) Availability Mapping
- **File:** `src/lib/firestoreService.js:234-237`
- **Issue:** For each referee, the full availability array is filtered — O(n²) complexity
  ```javascript
  referees.map(r => ({
    availability: availabilityRaw.filter(a => a.referee_id === r.id)
  }))
  ```
- **Fix:** Pre-build a `Map` keyed by `referee_id` for O(1) lookups

### M2: Full Users Collection Fetched on Every Load
- **File:** `src/lib/firestoreService.js:145`
- **Issue:** `getDocs(collection(db, 'users'))` fetches all users every time data refreshes
- **Fix:** Filter by role or cache with TTL; add pagination

### M3: No Pagination on Any Collection
- **File:** `src/lib/firestoreService.js:172-198`
- **Issue:** Messages, games, notifications, and ratings are all fetched unbounded
- **Fix:** Add `limit()` + cursor-based pagination; implement infinite scroll or load-more UI

### M4: `dangerouslySetInnerHTML` in Chart Component
- **File:** `src/components/ui/chart.jsx:60`
- **Issue:** CSS injected via `__html` — risky pattern if `config` ever accepts user input
- **Fix:** Use a CSS-in-JS approach or style injection without raw HTML

### M5: Firestore Composite Indexes Not Verified
- **File:** `src/hooks/useRealtimeNotifications.js:35-46`
- **Issue:** Composite `where` + `orderBy` queries require Firestore indexes; fallback is silent
- **Fix:** Confirm indexes in `firestore.indexes.json` are deployed; add CI check

---

## Architecture Issues

| # | Issue | Recommendation |
|---|-------|----------------|
| A1 | `DataContext` exports 40+ functions/values | Split into smaller, domain-specific contexts |
| A2 | `firestoreService.js` is 563 lines mixing queries, mapping, and logic | Separate into `queries.js`, `mappers.js`, `businessLogic.js` |
| A3 | Magic strings (`'manager'`, `'referee'`, `'assigned'`) scattered throughout | Create `src/constants.js` with enums |
| A4 | Demo account data duplicated across 3 files | Single source of truth; import everywhere |

---

## Error Handling

| # | Issue | File |
|---|-------|------|
| E1 | Fallback to unsorted notifications is silent | `useRealtimeNotifications.js:81-89` |
| E2 | Error toast shown but UI renders stale data with no retry option | `useDataFetching.js:41-66` |
| E3 | Avatar upload error messages are too generic | `AuthContext.jsx:228-229` |
| E4 | Profile fetch failure during auth change silently logs user out | `AuthContext.jsx:117-120` |

---

## Performance Issues

| # | Issue | File |
|---|-------|------|
| P1 | Client-side sorting of full datasets | `firestoreService.js:220-240` |
| P2 | O(n²) availability filtering (see M1) | `firestoreService.js:234-237` |
| P3 | `filteredMessages` recalculates on every render without `useMemo` | `Messages.jsx:40-44` |
| P4 | External CDN image with no loading state or local fallback | `Login.jsx:92` |

---

## Code Quality

| # | Issue | File |
|---|-------|------|
| Q1 | `console.warn = () => {}` globally silences all warnings | `vite.config.js:267` |
| Q2 | ESLint: `no-unused-vars: off`, `react/prop-types: off` | `eslint.config.mjs:29-41` |
| Q3 | Inconsistent error message formatting (plain text vs. emoji) | Throughout |
| Q4 | No JSDoc on complex public functions (`mapGame`, `fetchAppData`) | `firestoreService.js` |
| Q5 | Vite dev error handlers use `postMessage(..., '*')` — no origin check | `vite.config.js` |

---

## Testing

**Current Coverage: 0%** — No test files exist in the codebase.

Missing:
- Unit tests for mappers and utilities
- Integration tests for auth flows and assignments
- E2E tests for critical user journeys

**Recommendation:** Add Jest + React Testing Library; target 70%+ coverage before next major release

---

## Dependencies & Configuration

| Item | Status |
|------|--------|
| Firebase v12.11.0 | Minor update available (v13.x) |
| Vite v4.4.5 | Major update available (v5.x) |
| React 18.2.0 | Up to date |
| No `.env.example` file | Create one for developer onboarding |
| No pre-commit hooks | Add Husky + lint-staged |
| `npm audit` | Add to CI/CD pipeline |

---

## Immediate Action Checklist

- [ ] Remove hardcoded passwords from `src/pages/Login.jsx:53`
- [ ] Delete `memory/test_credentials.md` and rotate any exposed credentials
- [ ] Add startup validation for all `VITE_FIREBASE_*` environment variables
- [ ] Create `.env.example` with all required variable names
- [ ] Add `.env` and `memory/test_credentials.md` to `.gitignore`
- [ ] Fix N+1 Firestore query using `where(documentId(), 'in', gameIds)`
- [ ] Restrict Firestore notification creation to Cloud Functions only
- [ ] Remove `console.warn = () => {}` from `vite.config.js`

---

## Severity Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 4 |
| Medium | 5 |
| Architecture | 4 |
| Error Handling | 4 |
| Performance | 4 |
| Code Quality | 5 |
| Testing Gaps | Many |

---

*Generated by automated AI code audit on 2026-04-11*
