# iWhistle — Code Review

**Initial review:** 2026-04-04  
**Re-review:** 2026-04-05  
**Reviewer:** Claude (AI)  
**Scope:** Full codebase review — architecture, bugs, performance, security, code quality

---

## Status Overview

| Category     | Priority | Total | Fixed | Remaining |
|--------------|----------|-------|-------|-----------|
| Bugs         | High     | 3     | 2     | 1         |
| Security     | High     | 2     | 2     | 0 (+1 new)|
| Performance  | Medium   | 2     | 1     | 1         |
| Code Quality | Medium   | 5     | 2     | 3         |
| Minor/Style  | Low      | 6     | 1     | 5         |

---

## Fixed ✅

### 1. ~~Null dereference crash on `a.referee.id` in Dashboard~~ — FIXED
**`src/pages/Dashboard.jsx:43`** — Optional chaining `a.referee?.id` added.

### 3. ~~Double `setLoading(false)` in `uploadAvatar`~~ — FIXED
**`src/contexts/AuthContext.jsx`** — `uploadAvatar` now inlines its own storage update instead of calling `updateProfile`, eliminating the double loading state.

### 4. ~~No file size validation on avatar upload~~ — FIXED
**`src/contexts/AuthContext.jsx:202–211`** — 1 MB guard added before `readFileAsDataUrl`.

### 5. ~~`obfuscate` silently falls back to storing plaintext~~ — FIXED
**`src/contexts/AuthContext.jsx:21`** — Now uses `btoa(encodeURIComponent(str))` which safely handles Unicode.

### 7. ~~All page components are eagerly bundled~~ — FIXED
**`src/App.jsx`** — All 17 routes converted to `React.lazy` with a `Suspense` fallback.

### 8. ~~Dead parameters in `useAssignmentActions`~~ — FIXED
**`src/hooks/useAssignmentActions.js:10`** and **`src/contexts/DataContext.jsx:51`** — `sendMessage` and `games` removed from both signature and call site.

### 12. ~~`.substr()` is deprecated~~ — FIXED
**`src/contexts/AuthContext.jsx`** — Replaced with `.substring(2, 11)`.

### 14. ~~"Games This Month" stat counted all games~~ — FIXED
**`src/pages/Dashboard.jsx`** — Inline month/year filter now applied.

---

## Open Issues

---

### High Priority — Bugs

#### 2. Pagination is silently broken

**File:** `src/hooks/useDataFetching.js:5`

`page` defaults to `1` and is never incremented. `DataContext` calls `useDataFetching(user)` with no page argument, so the page never advances. `hasMoreGames` is computed and returned but nothing in the UI consumes it to trigger a next-page load. The feature is entirely non-functional.

**Fix:** Wire up a `loadMore` callback that increments `page` and calls `fetchData(false)`, or remove the dead pagination parameters until the feature is intentionally built out.

---

### High Priority — Security (New)

#### 19. Legacy `btoa(password)` fallback in login can throw for Unicode

**File:** `src/contexts/AuthContext.jsx:92`

The three-way login compatibility check includes a bare `btoa(password)` call:

```js
u.password === obfuscatedPassword || u.password === btoa(password) || u.password === password
```

If a legacy account was created with a Unicode password, `btoa(password)` throws a `DOMException`, which bubbles up as a confusing error instead of "Invalid email or password." The same Unicode fix applied to `obfuscate` needs to be applied here.

```js
// Safe legacy check — wrap in try/catch so Unicode doesn't throw
let legacyHash = '';
try { legacyHash = btoa(password); } catch { /* non-latin1, skip legacy check */ }

const foundUser = users.find(u =>
  u.email.toLowerCase() === email.toLowerCase() &&
  (u.password === obfuscatedPassword || (legacyHash && u.password === legacyHash) || u.password === password)
);
```

---

#### 20. `deobfuscate` is defined but never used

**File:** `src/contexts/AuthContext.jsx:22`

```js
const deobfuscate = (str) => { try { return decodeURIComponent(atob(str)); } catch { return str; } };
```

This was added alongside the `obfuscate` fix but is not called anywhere in the file. Remove it or use it.

---

### Medium Priority — Performance

#### 6. Full loading spinner fires on every background mutation

**File:** `src/hooks/useDataFetching.js:36`

Every call to `fetchData()` — including marking a notification read or submitting a rating — immediately calls `setLoading(true)`, triggering a full-page loading spinner. Actions that should feel instant cause visible UI flicker.

**Fix:** Introduce a separate `refreshing` state for background refetches:

```js
const [loading, setLoading] = useState(true);      // initial load only
const [refreshing, setRefreshing] = useState(false); // background refetch

const fetchData = useCallback(async (isInitialLoad = true) => {
  if (isInitialLoad) setLoading(true);
  else setRefreshing(true);
  // ...
  setLoading(false);
  setRefreshing(false);
}, [...]);
```

Consumers can show a subtle inline indicator using `refreshing` rather than blocking the whole UI.

---

### Medium Priority — Code Quality

#### 9. Opaque context API via `...spread`

**File:** `src/contexts/DataContext.jsx:172–177`

Spreading all action hooks into a single flat context value allows naming collisions to be silently swallowed and makes the API invisible without reading the source:

```js
...tournamentActions,
...gameActions,
...assignmentActions,  // could quietly override a key from above
...messageActions,
...availabilityActions,
...reportActions
```

**Fix:** Namespace the action groups:

```js
const value = {
  loading, games, payments, /* ...data... */
  tournament: tournamentActions,
  game: gameActions,
  assignment: assignmentActions,
  message: messageActions,
  availability: availabilityActions,
  report: reportActions,
};
```

---

#### 10. Dual snake_case / camelCase property mapping bloats every object

**File:** `src/lib/demoDataService.js:598–684`

Every mapped entity carries every field under both naming conventions:

```js
startDate: tournament.start_date,
start_date: tournament.start_date,  // identical value, two keys
```

This runs across games, payments, messages, availability, and reports — doubling every mapped object's size and creating ambiguity about which key consumers should use.

**Fix:** Pick camelCase as the single convention throughout the front-end. Use snake_case only at the boundary when a real backend is integrated.

---

#### 11. Misleading `async` functions that contain no `await`

**File:** `src/hooks/useAssignmentActions.js:11, 22, 33, 46, 66` and `src/hooks/useGameActions.js`

Several action functions are marked `async` but never `await` anything. The underlying `demoDataService` functions are synchronous. The `async` keyword adds an implicit Promise wrapper and misleads readers into expecting I/O.

```js
// Misleading — nothing is awaited
const assignRefereeToGame = async (gameId, refereeId) => { ... };

// Fix — remove async
const assignRefereeToGame = (gameId, refereeId) => { ... };
```

---

### Low Priority — Minor / Style

#### 13. Role-based redirect is hardcoded to exactly two roles

**File:** `src/components/ProtectedRoute.jsx:19`

```js
// Current
return <Navigate to={user.role === 'manager' ? '/manager' : '/dashboard'} replace />;

// Fix — lookup map scales better
const ROLE_HOME = { manager: '/manager', referee: '/dashboard' };
return <Navigate to={ROLE_HOME[user.role] ?? '/dashboard'} replace />;
```

---

#### 15. `markNotificationRead` has no error handling

**File:** `src/contexts/DataContext.jsx:55–65`

Unlike every other action in `DataContext`, the notification-read functions drop errors silently. Wrap in a try/catch or check the return value for consistency.

---

#### 16. Demo credentials duplicated across two files

**Files:** `src/contexts/AuthContext.jsx:228–253` and `src/lib/demoDataService.js:48–150`

Both files hardcode the same demo account objects with the same IDs. A schema change in one that's missed in the other silently breaks demo logins.

**Fix:** Extract to a single `src/lib/demoAccounts.js` and import from both.

---

#### 17. DST edge case in conflict detection

**File:** `src/lib/conflictUtils.js:3–5`

```js
const toDate = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}`);
```

Without a timezone offset, the browser parses this as local time. During a DST transition, games at the boundary hour will be misinterpreted.

**Fix:** Append `Z` for consistent UTC parsing, or use `date-fns` `parseISO`.

---

#### 18. `GAME_DURATION_MINS` hardcoded for all conflict checks

**File:** `src/lib/conflictUtils.js:1`

All conflict detection assumes 90-minute games. Younger divisions typically run shorter.

```js
// Fix — read from game data with fallback
const duration = targetGame.duration_mins ?? GAME_DURATION_MINS;
const targetEnd = new Date(targetStart.getTime() + duration * 60000);
```

---

## Suggested Fix Order (Remaining)

1. `AuthContext.jsx:92` — wrap legacy `btoa(password)` check in try/catch **(new — security)**
2. `AuthContext.jsx:22` — remove unused `deobfuscate` **(new — cleanup)**
3. `useDataFetching.js` — decouple `loading` from background refreshes **(UX impact)**
4. `useDataFetching.js` — fix or remove broken pagination parameters
5. `DataContext.jsx` — namespace action groups in context value
6. `demoDataService.js` — consolidate to single naming convention
7. Remaining low-priority items as bandwidth allows
