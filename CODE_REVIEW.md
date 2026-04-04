# iWhistle — Code Review

**Date:** 2026-04-04  
**Reviewer:** Claude (AI)  
**Scope:** Full codebase review — architecture, bugs, performance, security, code quality

---

## Summary

| Category     | Priority | Issues |
|--------------|----------|--------|
| Bugs         | High     | 3      |
| Security     | High     | 2      |
| Performance  | Medium   | 2      |
| Code Quality | Medium   | 5      |
| Minor/Style  | Low      | 6      |

**Start here:** Fix the three bugs and two security issues before anything else. The remaining items are lower-risk quality improvements.

---

## High Priority — Bugs

### 1. Null dereference crash on `a.referee.id` in Dashboard

**File:** `src/pages/Dashboard.jsx:43`

`a.referee` can be `null` when an assignment record exists but the referee profile was not found during mapping. Accessing `.id` on null will throw a `TypeError` and crash the dashboard for that user.

```js
// Current — will crash if a.referee is null
game.assignments.some(a => a.referee.id === user.id && a.status === 'accepted')

// Fix — use optional chaining
game.assignments.some(a => a.referee?.id === user.id && a.status === 'accepted')
```

---

### 2. Pagination is silently broken

**File:** `src/hooks/useDataFetching.js:5`

`page` defaults to `1` and is never incremented. `DataContext` calls `useDataFetching(user)` with no page argument, so the page never advances. `hasMoreGames` is computed and returned but nothing in the UI consumes it to trigger a next-page fetch. The pagination feature is entirely non-functional.

**Fix:** Either wire up a `loadMore` callback that increments `page` and calls `fetchData(false)`, or remove the pagination parameters until the feature is intentionally built out. Dead infrastructure is more confusing than no infrastructure.

---

### 3. Double `setLoading(false)` in `uploadAvatar`

**File:** `src/contexts/AuthContext.jsx:207–222`

`uploadAvatar` calls `updateProfile`, which has its own `finally { setLoading(false) }` block. After `updateProfile` returns, `uploadAvatar`'s own `finally` block also calls `setLoading(false)`. The `loading` state is set to `false` twice in sequence. This is currently harmless but indicates that `setLoading` inside `updateProfile` is inadvertently coupled to its callers, making the loading lifecycle hard to reason about.

**Fix:** Remove `setLoading` calls from `updateProfile` and manage loading state only at the top-level call site (`uploadAvatar`), or split into a private `_updateProfile` that does not touch loading state.

---

## High Priority — Security

### 4. No file size validation on avatar upload

**File:** `src/contexts/AuthContext.jsx:207–222`

`readFileAsDataUrl` converts an uploaded image to a base64 data URL and stores it in localStorage with no size check. A 5 MB photo encodes to ~6.7 MB of base64, which can hit the browser's ~5 MB localStorage quota and silently corrupt or prevent writing other app data.

```js
// Add before calling readFileAsDataUrl:
if (file.size > 1_000_000) {
  toast({
    title: "Image too large",
    description: "Please upload a photo under 1 MB.",
    variant: "destructive",
  });
  setLoading(false);
  return;
}
```

---

### 5. `obfuscate` silently falls back to storing plaintext

**File:** `src/contexts/AuthContext.jsx:21–27`

`btoa` throws a `DOMException` for strings containing non-Latin-1 characters (e.g. passwords with emoji or accented characters). The current catch block silently returns the raw password string, which then gets stored in localStorage in plaintext with no warning.

```js
// Current — plaintext fallback on failure
const obfuscate = (str) => {
  try { return btoa(str); }
  catch (e) { return str; }  // raw password stored on error
};

// Fix — encode to UTF-8 bytes first, which btoa can always handle
const obfuscate = (str) => btoa(encodeURIComponent(str));
const deobfuscate = (str) => decodeURIComponent(atob(str));
```

Update the login check in `AuthContext.jsx:95–98` to use `deobfuscate` when comparing.

---

## Medium Priority — Performance

### 6. Full loading spinner fires on every background mutation

**File:** `src/hooks/useDataFetching.js:36`

Every call to `fetchData()` — including minor actions like marking a notification read — immediately calls `setLoading(true)`, which triggers a full-UI loading spinner. This causes visible flicker on actions that should feel instant.

**Fix:** Introduce a separate `refreshing` state for background refetches, and only show the spinner when `refreshing` is false (i.e. the very first load):

```js
const [loading, setLoading] = useState(true);     // initial load only
const [refreshing, setRefreshing] = useState(false); // background refetch

const fetchData = useCallback(async (isInitialLoad = true) => {
  if (isInitialLoad) setLoading(true);
  else setRefreshing(true);
  // ...
  setLoading(false);
  setRefreshing(false);
}, [...]);
```

---

### 7. All page components are eagerly bundled

**File:** `src/App.jsx:14–31`

All 16+ page components are imported at the top of `App.jsx`, including heavy pages like `PerformanceAnalytics` (Recharts) and `Manager` (multi-tab console). They all ship in the initial JS bundle, slowing first load.

**Fix:** Use React lazy loading per route:

```js
// Replace static imports:
import Dashboard from '@/pages/Dashboard';

// With lazy imports:
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));

// Wrap <Routes> with:
<React.Suspense fallback={<LoadingSpinner />}>
  <Routes>...</Routes>
</React.Suspense>
```

---

## Medium Priority — Code Quality

### 8. Dead parameters in `useAssignmentActions`

**File:** `src/hooks/useAssignmentActions.js:10`

`sendMessage` and `games` are accepted as parameters but are never referenced anywhere inside the hook. They appear to be leftovers from an earlier design.

```js
// Current
export const useAssignmentActions = (user, fetchData, sendMessage, games) => {

// Fix — remove unused parameters
export const useAssignmentActions = (user, fetchData) => {
```

Update the call site in `DataContext.jsx:51` accordingly.

---

### 9. Opaque context API via `...spread`

**File:** `src/contexts/DataContext.jsx:172–177`

Spreading all action hooks into a single context value makes the API invisible to consumers and allows naming collisions to be silently swallowed:

```js
...tournamentActions,
...gameActions,
...assignmentActions,  // could quietly override a key from gameActions
...messageActions,
...availabilityActions,
...reportActions
```

**Fix:** Namespace the action groups in the context value:

```js
const value = {
  // data
  loading, games, payments, ...
  // actions
  tournament: tournamentActions,
  game: gameActions,
  assignment: assignmentActions,
  message: messageActions,
  // ...
};
```

This also makes it obvious in consumer code what domain an action belongs to: `assignment.assignRefereeToGame(...)` vs `assignRefereeToGame(...)`.

---

### 10. Dual snake_case / camelCase property mapping bloats every object

**File:** `src/lib/demoDataService.js:598–684`

Every mapped entity (games, payments, messages, tournaments, etc.) has every field duplicated under both naming conventions:

```js
startDate: tournament.start_date,
start_date: tournament.start_date,  // identical value, two keys
```

This pattern runs across all entity types and doubles the memory footprint of every mapped object. It also creates ambiguity — consumers can't tell which key to use.

**Fix:** Pick one convention (camelCase is idiomatic for JS front-ends) and do a one-time find-and-replace across consumers. Use the snake_case names only when sending data to a real backend.

---

### 11. Misleading `async` functions that contain no `await`

**File:** `src/hooks/useAssignmentActions.js:11, 22, 33, 46, 66`

Several action functions are marked `async` but never `await` anything. The underlying `demoDataService` functions are synchronous. The `async` keyword adds an implicit Promise wrapper and misleads readers into thinking I/O is happening.

```js
// Misleading — nothing is awaited
const assignRefereeToGame = async (gameId, refereeId) => { ... };

// Fix — remove async unless you actually await something
const assignRefereeToGame = (gameId, refereeId) => { ... };
```

Same issue exists in `useGameActions.js`.

---

### 12. `.substr()` is deprecated

**File:** `src/contexts/AuthContext.jsx:131`

```js
// Deprecated
Math.random().toString(36).substr(2, 9)

// Fix
Math.random().toString(36).substring(2, 11)
```

---

## Low Priority — Minor / Style

### 13. Role-based redirect is hardcoded to exactly two roles

**File:** `src/components/ProtectedRoute.jsx:19`

```js
return <Navigate to={user.role === 'manager' ? '/manager' : '/dashboard'} replace />;
```

A role lookup map scales better if roles expand:

```js
const ROLE_HOME = { manager: '/manager', referee: '/dashboard' };
return <Navigate to={ROLE_HOME[user.role] ?? '/dashboard'} replace />;
```

---

### 14. "Games This Month" stat counts all games, not this month's

**File:** `src/pages/Dashboard.jsx:56–59`

The stat labeled "Games This Month" uses `games.length`, which reflects the current paginated result set (up to 20 games, any date range). Add an actual month filter:

```js
const thisMonth = new Date().getMonth();
const thisYear = new Date().getFullYear();
const gamesThisMonth = games.filter(g => {
  const d = new Date(g.date);
  return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
});
```

---

### 15. `markNotificationRead` has no error handling

**File:** `src/contexts/DataContext.jsx:55–65`

Unlike every other action in `DataContext`, the notification-read functions are fire-and-forget with no error path:

```js
const markNotificationRead = (notificationId) => {
  if (!user) return;
  markNotificationReadRecord(user, notificationId);  // errors silently dropped
  fetchData();
};
```

Wrap in a try/catch or check the return value for consistency with the rest of the file.

---

### 16. Demo credentials are duplicated across two files

**Files:** `src/contexts/AuthContext.jsx:228–253` and `src/lib/demoDataService.js:48–150`

Both files define the same demo account objects with the same hardcoded IDs (`demo-manager`, `demo-referee`). If one is updated (e.g. a field is added to the profile schema) and the other is not, demo logins break silently.

**Fix:** Export demo account constants from a single `src/lib/demoAccounts.js` file and import them in both places.

---

### 17. DST edge case in `toDate` / conflict detection

**File:** `src/lib/conflictUtils.js:3–5`

```js
const toDate = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}`);
```

Concatenating a date and time string without a timezone offset causes the browser to parse it as local time. During a Daylight Saving Time transition (e.g. clocks spring forward at 2 AM), a game scheduled at 2:30 AM on that day will be misinterpreted. This is a rare edge case for a youth basketball app, but worth noting.

**Fix:** Append `Z` to treat as UTC consistently, or use `date-fns` `parseISO` which handles these edge cases.

---

### 18. `GAME_DURATION_MINS` hardcoded for all conflict checks

**File:** `src/lib/conflictUtils.js:1`

Game duration is fixed at 90 minutes. Younger divisions often run 60-minute games. Consider adding a `duration_mins` field to the game schema and falling back to 90:

```js
const duration = targetGame.duration_mins ?? GAME_DURATION_MINS;
const targetEnd = new Date(targetStart.getTime() + duration * 60000);
```

---

## Suggested Fix Order

1. `Dashboard.jsx:43` — null guard on `a.referee?.id` (prevents runtime crash)
2. `AuthContext.jsx:21–27` — fix `obfuscate` to handle Unicode safely
3. `AuthContext.jsx:207` — add file size check before avatar upload
4. `useAssignmentActions.js:10` — remove dead `sendMessage` / `games` parameters
5. `useDataFetching.js` — decouple `loading` from background refreshes (UX)
6. `App.jsx` — lazy-load route components (bundle size)
7. Dual-key mapping in `demoDataService.js` — pick one naming convention
8. Remaining minor items as bandwidth allows
