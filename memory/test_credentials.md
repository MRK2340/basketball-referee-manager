# iWhistle Test Credentials

## Demo Accounts (Firebase Auth)

| Role    | Email               | Password   | Notes                       |
|---------|---------------------|------------|-----------------------------|
| Manager | manager@demo.com    | manager123 |                             |
| Referee | referee@demo.com    | Referee123 | Capital R — case-sensitive  |

## Firebase Project
- Project ID: iwhistle-6f5d1
- Auth domain: iwhistle-6f5d1.firebaseapp.com

## Setup Notes
- Both accounts pre-created in Firebase Auth Console
- On FIRST login of BOTH demo users, Firestore seed data is auto-populated
  (triggered by `checkAndSeedDemoData()` in `/app/src/lib/seedFirestore.js`)
- Seed guard: `_meta/demo_seed` document in Firestore prevents duplicate seeding
- Firestore security rules: `/app/memory/firestore_security_rules.txt`
