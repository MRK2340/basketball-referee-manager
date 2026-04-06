# Firebase Deployment Guide — iWhistle

## 1. Deploy Security Rules

**Firebase Console → Firestore Database → Rules**

Paste the contents of `/app/memory/firestore_security_rules.txt` and click **Publish**.

### What changed from the original rules:

| Rule | Change | Why |
|------|--------|-----|
| `users` update | Blocks changes to the `role` field | Prevents a user from escalating themselves to manager |
| `_meta` write | Only allowed when doc doesn't exist (`resource == null`) | Prevents anyone from overwriting the seed guard and triggering a re-seed |
| `referee_ratings` read | Referees can only read their own ratings | Prevents cross-referee data leakage |
| `referee_ratings` update | Manager must own the rating (`manager_id == uid`) | Prevents managers from overwriting each other's ratings |

---

## 2. Deploy Firestore Composite Indexes

Composite indexes are **required** for the `orderBy` queries added to the realtime listeners
(notifications and messages).  Without them Firestore returns an error and listeners will fail.

### Option A — Firebase CLI (recommended)

```bash
# Install the CLI if you haven't already
npm install -g firebase-tools

# Log in
firebase login

# Deploy only indexes (safe, non-destructive)
firebase deploy --only firestore:indexes --project <your-project-id>
```

The indexes are defined in `/app/firestore.indexes.json`.

### Option B — Firebase Console (manual)

Go to **Firebase Console → Firestore Database → Indexes → Composite** and add each entry below:

| Collection | Fields | Query scope |
|------------|--------|-------------|
| `notifications` | `recipient_id` ASC, `created_at` DESC | Collection |
| `notifications` | `recipient_id` ASC, `read` ASC | Collection |
| `messages` | `participants` ARRAY_CONTAINS, `created_at` DESC | Collection |
| `game_assignments` | `game_id` ASC, `referee_id` ASC | Collection |
| `game_reports` | `game_id` ASC, `referee_id` ASC | Collection |
| `referee_ratings` | `game_id` ASC, `referee_id` ASC | Collection |
| `manager_connections` | `referee_id` ASC, `manager_id` ASC | Collection |

> **Note:** Single-field indexes (e.g., `where('manager_id', '==', x)`) are auto-created by 
> Firestore and do NOT need manual configuration.

---

## 3. Performance Improvements (Already Applied in Code)

The following code changes are **already deployed** in this fork — no action needed:

| Change | Benefit |
|--------|---------|
| `fetchAppData` — fetch all users in one read, split by role in JS | Saves **3 Firestore reads** on every page load |
| `useRealtimeNotifications` — added `orderBy + limit(100)` | Sorting delegated to Firestore; caps at 100 docs |
| `useRealtimeMessages` — added `orderBy + limit(100)` | Same; inbox capped at 100 most recent messages |

---

## 4. Firebase Project Setup Checklist

- [ ] Security rules deployed (Step 1)
- [ ] Composite indexes deployed (Step 2) — **required for real-time notifications + messages to work**
- [ ] Firebase Auth → Sign-in methods → Email/Password enabled
- [ ] Firestore Database ID is `refereemanager` (verify in Firebase Console)
- [ ] VITE_ environment variables set in `/app/.env` (already configured)
