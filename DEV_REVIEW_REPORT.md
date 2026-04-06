# Basketball Referee Manager — Development Review Report

**Date:** April 6, 2026
**Branch:** `claude/review-code-updates-V45C9`
**Reviewed By:** Claude Code (AI-assisted review)
**Prepared For:** Development Team

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| Project | Basketball Referee Manager |
| Stack | React 18, Vite, Firebase 12, Tailwind CSS, Radix UI (shadcn) |
| Routing | React Router v6 (lazy-loaded routes) |
| State | Context API (`AuthContext`, `DataContext`) |
| Backend | Firebase Firestore + Firebase Auth |
| PDF Export | jsPDF + jspdf-autotable |
| Charts | Recharts |
| Animation | Framer Motion |
| Build Tool | Vite 4 |

> **Note:** `@supabase/supabase-js` is present in `package.json` but appears to be an unused leftover from a previous backend migration.

---

## 2. Architecture Assessment

### What's Working Well
- Clean modular structure: `components/`, `contexts/`, `hooks/`, `pages/`, `lib/`
- Lazy-loaded route splitting in `App.jsx` for optimized bundle sizes
- Real-time listeners via Firestore `onSnapshot` for messages and notifications
- Consistent use of custom action hooks (`useGameActions`, `useMessageActions`, etc.) to separate business logic from UI
- Error boundary implemented (`ErrorBoundary.jsx`)
- Shadcn/Radix UI components for accessible, consistent UI patterns

### Structural Concerns
- **Two backend implementations coexist**: `demoDataService.js` (1,421 lines) and `firestoreService.js` (540 lines). The demo service is no longer used but remains in the codebase, creating confusion.
- **`@supabase/supabase-js`** is listed as a dependency but is not used — leftover from a prior architecture.

---

## 3. Issues by Severity

---

### CRITICAL

#### C-1 — Undefined Recipient Causes Message Send Failure
**Files:** `src/pages/Messages.jsx:56–64`, `src/lib/firestoreService.js:352–355`

When a user opens the compose form, the recipient defaults to `recipientOptions[0]?.id || null`. If no recipients are available, `newRecipientId` is set to `null`. This null propagates into the Firestore write as `undefined`, which Firestore rejects, causing a runtime error.

**Impact:** Users cannot send messages in certain conditions — a core feature is broken.

**Fix:**
- Add a recipient dropdown/search in the compose form and disable the Send button until a valid recipient is selected.
- Add a guard in the send handler:
```js
if (!newRecipientId) throw new Error('Please select a recipient before sending.');
```

---

#### C-2 — No Ownership Validation Before Unassigning Referees
**File:** `src/lib/firestoreService.js:313–315`

```js
export const unassignReferee = async (user, assignmentId) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can unassign referees.');
  await deleteDoc(doc(db, 'game_assignments', assignmentId)); // No ownership check
});
```

Any manager can unassign a referee from any other manager's game. The Firestore security rules are the only guard, and those may have gaps.

**Impact:** Cross-manager data interference. Potential for accidental or malicious deletion of another manager's assignments.

**Fix:** Fetch the assignment first, verify `user.id === assignment.manager_id`, then delete:
```js
const aSnap = await getDoc(doc(db, 'game_assignments', assignmentId));
if (aSnap.data()?.manager_id !== user.id) throw new Error('Unauthorized.');
await deleteDoc(aSnap.ref);
```

---

#### C-3 — Game Completion Silently Creates $0 Payments
**File:** `src/lib/firestoreService.js:266–286`

```js
amount: gameData?.payment_amount || 0, // Silently defaults to $0 if missing
```

If a game has no `payment_amount` set, referees are issued a payment record of `$0.00` with no error or warning.

**Impact:** Referees do not get paid and may not know why. No audit trail that something went wrong.

**Fix:** Validate before committing the batch:
```js
if (!gameData?.payment_amount || gameData.payment_amount <= 0) {
  throw new Error('Cannot complete game: a valid payment amount is required.');
}
```

---

### HIGH

#### H-1 — Firestore Message Rule Allows Spoofed Conversations
**File:** `firestore.rules:73–80`

```js
allow create: if isAuth(); // Any auth user can write any participants array
```

An authenticated user can create a message document with any arbitrary `participants` array, enabling impersonation — e.g., faking a conversation between two other users.

**Fix:**
```js
allow create: if isAuth() && request.auth.uid in request.resource.data.participants;
```

---

#### H-2 — N+1 Queries When Loading Referee Games
**File:** `src/lib/firestoreService.js:145–151`

```js
const gPromises = gameIds.map(id => getDoc(doc(db, 'games', id)));
const gDocs = await Promise.all(gPromises); // 1 round-trip per game
```

For a referee with 50 game assignments, this issues 50 individual Firestore reads on every page load.

**Impact:** Slow initial load, high latency on mobile/slow connections, increased Firestore billing.

**Fix:** Use an `in` query (max 30 IDs per query, chunk if needed):
```js
const gamesSnap = await getDocs(
  query(collection(db, 'games'), where(documentId(), 'in', gameIds))
);
```

---

#### H-3 — Managers Fetch All Referee Ratings (No Filter)
**File:** `src/lib/firestoreService.js:172–174`

```js
getDocs(isManager
  ? collection(db, 'referee_ratings') // Reads entire collection — no manager filter
  : query(collection(db, 'referee_ratings'), where('referee_id', '==', user.id))),
```

Every manager page load reads every rating from every manager in the database.

**Impact:** As data grows, this becomes extremely expensive and slow.

**Fix:**
```js
query(collection(db, 'referee_ratings'), where('manager_id', '==', user.id))
```

---

### MEDIUM

#### M-1 — Avatar Images Stored as Base64 in Firestore
**File:** `src/contexts/AuthContext.jsx:213–230`

Avatar files are converted to base64 data URLs and stored directly inside the Firestore user document. Firestore has a 1MB per-document limit.

**Impact:** Large avatars could approach or exceed the document size limit. All user queries carry avatar payload unnecessarily.

**Fix:** Upload avatars to Firebase Storage and store only the download URL in Firestore.

---

#### M-2 — Inconsistent Field Naming (`read` vs `is_read`)
**File:** `src/lib/firestoreService.js:89–90`

The message mapper outputs both `read` and `is_read` on the same object. Firestore stores `is_read`. The UI consumes `read`. This works but creates ongoing confusion.

**Fix:** Standardize to one convention. Recommend `is_read` in Firestore, mapped to `isRead` in JS objects.

---

#### M-3 — Generic Error Handling for All Firestore Errors
**File:** `src/lib/firestoreService.js:17–24`

```js
catch (err) {
  return { error: createError(err.message || 'An unexpected error occurred.') };
}
```

All Firestore errors surface the same way: a generic message. Permission errors, network failures, and invalid arguments are indistinguishable to the user.

**Fix:** Map Firestore error codes similarly to the `mapFirebaseError` function in `AuthContext.jsx`:
```js
if (err.code === 'permission-denied') return { error: 'You don\'t have access to do that.' };
if (err.code === 'unavailable') return { error: 'Network error. Please check your connection.' };
```

---

#### M-4 — Missing Null Checks in `mapGame` Can Cause Silent Crashes
**File:** `src/lib/firestoreService.js:32–62`

```js
const ref = allUsers.find(u => u.id === a.referee_id) || {}; // Falls back to empty object
```

When a referee user is not found, an empty object is used as fallback. Downstream code that accesses `ref.name` or `ref.email` returns `undefined`, which can crash renders silently.

**Fix:** Prefer explicit null handling with a warning log, or ensure data integrity at the query level.

---

#### M-5 — Stale Closure Risk in `useRealtimeMessages`
**File:** `src/hooks/useRealtimeMessages.js:33–36`

```js
useEffect(() => {
  usersMapRef.current = usersMap; // No dependency array — runs on every render
});
```

The missing dependency array means this effect runs after every render, not just when `usersMap` changes. While not a memory leak, it can cause ordering issues.

**Fix:**
```js
useEffect(() => {
  usersMapRef.current = usersMap;
}, [usersMap]);
```

---

### LOW / INFORMATIONAL

#### L-1 — Hard-Coded Demo Credentials in `Login.jsx`
**File:** `src/pages/Login.jsx:48–54`

```js
const demoPassword = role === 'manager' ? 'manager123' : 'Referee123';
```

Acceptable for demo/development purposes, but should be environment-gated before any public or production deployment.

**Fix:** Gate behind `import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true'`.

---

#### L-2 — Firebase Config Has No Startup Validation
**File:** `src/lib/firebase.js`

If `VITE_FIREBASE_*` environment variables are missing, Firebase initializes silently and only fails at the first API call.

**Fix:** Validate all config values at startup:
```js
Object.entries(firebaseConfig).forEach(([key, val]) => {
  if (!val) throw new Error(`Missing Firebase config: ${key}`);
});
```

---

#### L-3 — Unused Supabase Dependency
**File:** `package.json`

`@supabase/supabase-js` is listed but not imported anywhere. Adds ~50KB to install size.

**Fix:** `npm uninstall @supabase/supabase-js`

---

## 4. Technical Debt

| Item | File | Action |
|------|------|--------|
| Unused demo data service (1,421 lines) | `src/lib/demoDataService.js` | Delete |
| Seed data duplicated across two files | `src/lib/seedFirestore.js` + `demoDataService.js` | Consolidate into one |
| Composite Firestore indexes missing | `useRealtimeMessages.js:51`, `useRealtimeNotifications.js:34` | Deploy indexes via `firestore.indexes.json` |
| Client-side sorting instead of index-backed `orderBy` | Both real-time hooks | Add indexes and enable server-side ordering |

---

## 5. File Size Reference

| File | Lines | Notes |
|------|-------|-------|
| `demoDataService.js` | 1,421 | Unused — should be deleted |
| `firestoreService.js` | 540 | Core backend service |
| `seedFirestore.js` | 266 | Dev utility |
| `AuthContext.jsx` | 248 | Auth + avatar logic |
| `DataContext.jsx` | 247 | App-wide data state |
| `useRealtimeMessages.js` | 104 | Real-time listener |
| `useAssignmentActions.js` | 93 | Assignment CRUD |
| `useDataFetching.js` | 85 | Fetch orchestration |
| `useRealtimeNotifications.js` | 83 | Notification listener |

---

## 6. Recommended Sprint Backlog

### Sprint 1 — Critical Bug Fixes (Do First)
- [ ] **C-1** Fix undefined recipient in message compose — add recipient selector, validate before send
- [ ] **C-2** Add `manager_id` ownership check in `unassignReferee`
- [ ] **C-3** Validate `payment_amount > 0` before creating payments in `markGameCompleted`
- [ ] **H-1** Fix Firestore message `allow create` rule to require sender in participants

### Sprint 2 — Performance & Cost
- [ ] **H-2** Replace N+1 game queries with batched `in` query for referee game loading
- [ ] **H-3** Add `manager_id` filter to referee ratings query
- [ ] **M-1** Migrate avatar storage from Firestore base64 → Firebase Storage

### Sprint 3 — Quality & Debt Reduction
- [ ] **M-2** Standardize `read`/`is_read` field naming
- [ ] **M-3** Improve Firestore error mapping with specific error codes
- [ ] **M-4** Add null-safe handling in `mapGame` for missing referee references
- [ ] **M-5** Add dependency array to `usersMapRef` effect
- [ ] **L-2** Add Firebase config validation at startup
- [ ] **L-3** Remove unused Supabase dependency
- [ ] **DEBT** Delete `demoDataService.js`
- [ ] **DEBT** Deploy Firestore composite indexes

---

## 7. Overall Health Assessment

| Category | Rating | Notes |
|----------|--------|-------|
| Architecture | Good | Clean separation of concerns, well-structured |
| Code Quality | Fair | Modern patterns used but inconsistencies present |
| Security | Needs Work | Firestore rules have gaps; ownership not validated client-side |
| Performance | Needs Work | N+1 queries and unfiltered reads will not scale |
| Error Handling | Fair | Generic errors only; no differentiation |
| Technical Debt | Moderate | Unused files and dependencies inflate codebase |
| Feature Completeness | Good | Core flows functional; messaging has a critical bug |

**Overall:** The app has a solid architectural foundation and is functionally complete for most flows. The critical issues (messaging bug, payment validation, ownership checks) should be resolved before this is used in a real-world or production context. The performance issues are low impact now but will become significant as data volumes grow.

---

*Report generated: April 6, 2026 | Branch: `claude/review-code-updates-V45C9`*
