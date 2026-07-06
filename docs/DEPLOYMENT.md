# iWhistle — Go-Live Runbook

Three one-time steps, **in this order**, run from your own machine (they need
your Firebase and GitHub owner accounts — CI cannot do them for you).

Prerequisites (once):

```bash
npm install -g firebase-tools
firebase login          # opens a browser; sign in as the project owner
cd basketball-referee-manager && git checkout main && git pull
```

> The project (`iwhistle-6f5d1`) must be on the **Blaze** plan — Cloud
> Functions v2 and the scheduled reminder function require it. Firebase
> Console → ⚙ settings → Usage and billing → Modify plan.

---

## Step 1 — Deploy Cloud Functions + Firestore rules (do this FIRST)

`main` already contains the tightened security rules and the
`getPublicRefereeProfile` callable that the frontend on `main` expects.
Deploying hosting before these would break the public referee-profile page,
so functions + rules go out first:

```bash
cd functions && npm ci && cd ..
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

- First functions deploy may prompt to enable APIs (Cloud Build, Artifact
  Registry, Cloud Scheduler) — answer **yes**.
- Verify: Firebase Console → Functions should list `getPublicRefereeProfile`,
  `sendPushNotification`, `enforceMessageRateLimit`, `scheduleGameReminder`,
  `processGameReminders`; Firestore → Rules should show today's publish date.

## Step 2 — Create the GitHub deploy credential (enables auto-deploys)

From the repo root:

```bash
firebase init hosting:github
```

- Sign in to GitHub when prompted; repository: `MRK2340/basketball-referee-manager`.
- Answer **No** to "set up a workflow to run a build script before every
  deploy" and **No** to auto-deploy setup questions — the repo already has a
  hardened workflow (`.github/workflows/firebase-hosting.yml`).
- If the command still writes `.github/workflows/firebase-hosting-merge.yml`
  or `firebase-hosting-pull-request.yml`, delete them (keep ours) and
  commit/push the deletion.
- The command creates a service account and uploads a repo secret named
  `FIREBASE_SERVICE_ACCOUNT_IWHISTLE_6F5D1`. Our workflow accepts that name
  as-is — **no renaming needed**.

Verify: push any commit to `main` (or re-run the latest "Firebase Hosting"
run from the Actions tab) — the "Deploy to live channel" job should now run
instead of skipping, and https://iwhistle-6f5d1.web.app should serve the new
build. From then on every merge to `main` deploys automatically, and every
PR gets a 7-day preview URL.

## Step 3 — Protect `main` (require green CI before merge)

GitHub → repo **Settings → Branches → Add branch ruleset** (or classic
"Add rule"):

- Branch name pattern: `main`
- Enable **Require a pull request before merging**
- Enable **Require status checks to pass** and add these four checks
  (type the names exactly):
  - `Verify web app`
  - `Verify Cloud Functions`
  - `Verify backend dependencies`
  - `Validate Firebase rules`
- Enable **Require branches to be up to date before merging** (optional but
  recommended).

> The check names only appear in the picker after they've run at least once
> on a PR — they have (many times), so they should autocomplete.

---

## After go-live: beta smoke pass

1. Log in / log out; register a fresh account and sign in with it.
2. Enable 2FA and complete an MFA login.
3. As a manager: create a game, assign a referee, complete the game.
4. As the referee: accept the assignment, submit a game report.
5. Open `/referee/<referee-id>` in a private/incognito window (logged out) —
   the public profile should load via the Cloud Function.
6. Optional: set `VITE_SENTRY_DSN` as an Actions **variable** (Settings →
   Secrets and variables → Actions → Variables) to turn on error reporting
   in production builds.

## Routine deploys after setup

Nothing manual — merge to `main` and CI deploys hosting. Only re-run
Step 1's `firebase deploy --only functions,firestore:rules,firestore:indexes,storage`
when `functions/`, `firestore.rules`, `firestore.indexes.json`, or
`storage.rules` change.
