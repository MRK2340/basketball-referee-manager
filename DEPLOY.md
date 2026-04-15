# iWhistle - Firebase Deployment Guide

## Prerequisites

1. **Firebase CLI** installed:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Verify project** (should show `iwhistle-6f5d1`):
   ```bash
   firebase use
   ```

## Deploy Everything (Hosting + Functions + Rules)

```bash
# 1. Build the production bundle
yarn build

# 2. Deploy everything
firebase deploy
```

This deploys:
- **Hosting** (React SPA from `dist/`)
- **Cloud Functions** (push notifications, rate limiting, game reminders)
- **Firestore Rules** (security rules from `firestore.rules`)
- **Firestore Indexes** (composite indexes from `firestore.indexes.json`)
- **Storage Rules** (from `storage.rules`)

## Deploy Only Hosting (fastest)

```bash
yarn build
firebase deploy --only hosting
```

Your app will be live at: **https://iwhistle-6f5d1.web.app**

## Deploy Individual Services

```bash
# Firestore rules + indexes only
firebase deploy --only firestore

# Cloud Functions only
firebase deploy --only functions

# Storage rules only
firebase deploy --only storage
```

## Using a CI Token (for scripts/CI)

```bash
# Generate a token once
firebase login:ci

# Then deploy with token
firebase deploy --token YOUR_CI_TOKEN
```

## What Gets Deployed

| Service | Source | Target |
|---------|--------|--------|
| Hosting | `dist/` | https://iwhistle-6f5d1.web.app |
| Functions | `functions/index.js` | 3 Cloud Functions (us-central1) |
| Firestore Rules | `firestore.rules` | Security rules for all collections |
| Firestore Indexes | `firestore.indexes.json` | Composite indexes |
| Storage Rules | `storage.rules` | Avatar upload rules |

## Environment Variables

The `.env` file contains public Firebase config (safe to deploy):
- `VITE_FIREBASE_*` keys are baked into the build at `yarn build` time
- No server-side secrets are exposed

## Troubleshooting

- **Build fails?** Run `rm -rf node_modules/.vite && yarn install && yarn build`
- **Functions deploy fails?** Run `cd functions && yarn install && cd .. && firebase deploy --only functions`
- **Permission denied?** Run `firebase login` and ensure you have Editor/Owner role on the project
