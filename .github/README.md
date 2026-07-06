# GitHub environment

This repository expects a GitHub Actions environment named `github` for CI builds.

Add these variables to **Settings → Environments → github → Environment variables**:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_VAPID_KEY`
- `VITE_DEMO_MANAGER_PASSWORD`
- `VITE_DEMO_REFEREE_PASSWORD`
- `VITE_SENTRY_DSN`

The `VITE_*` Firebase values are client-side build configuration, so they are stored as GitHub environment variables instead of secrets. Use secrets only for private deployment credentials.
