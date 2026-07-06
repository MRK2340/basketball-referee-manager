# iWhistle — AAU Youth Basketball League Manager

[![CI](https://github.com/MRK2340/basketball-referee-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/MRK2340/basketball-referee-manager/actions/workflows/ci.yml)
[![Firebase Hosting](https://github.com/MRK2340/basketball-referee-manager/actions/workflows/firebase-hosting.yml/badge.svg)](https://github.com/MRK2340/basketball-referee-manager/actions/workflows/firebase-hosting.yml)

A full-featured web application for managing AAU youth basketball leagues. Referees can view their schedule, log availability, track earnings, and communicate with managers. Managers can assign referees, create tournaments, manage brackets, and use an AI-powered assistant — all in real time.

## Features

### Referees
- View assigned games and upcoming schedule
- Accept or decline game assignments
- Request to officiate open games
- Log availability on an interactive calendar
- Track payment history and earnings
- Submit post-game reports
- Import schedules from ArbiterSports, GameOfficials, Assigning.net (CSV / Excel / PDF)
- Independent game log with export (CSV / PDF)
- AI Referee Assistant — check schedule, manage availability, track earnings via plain English

### Managers
- Create and manage tournaments
- Schedule games and assign referees
- Bulk import games from CSV / Excel with auto-assign
- Real-time collaborative tournament bracket editor (single / double elimination / round-robin)
- Find replacement referees for declined assignments
- Review game reports and standings
- Referee leaderboard and performance analytics
- AI Manager Assistant — create games, tournaments, assign referees, update schedules via plain English

### Platform
- Fully typed TypeScript codebase with a `tsc` CI gate
- Real-time sync across all connected clients (Firestore `onSnapshot`)
- Offline-first with IndexedDB persistence
- Push notifications for game reminders (24h and 1h before)
- Two-factor authentication (TOTP / MFA)
- GDPR-compliant data export and account deletion
- Audit logging for sensitive actions
- Public referee profiles at `/referee/:id`, served by a Cloud Function that projects only public-safe fields
- Voice input for AI assistants (Web Speech API)
- Responsive UI — mobile bottom-nav, desktop sidebar

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 (Rolldown) |
| Language | TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS 4 (CSS-first) + Radix UI (shadcn components) |
| Animations | Motion (v12) |
| Charts | Recharts v3 |
| Auth | Firebase Authentication (email/password + TOTP MFA) |
| Database | Cloud Firestore (named database `refereemanager`) |
| Storage | Firebase Storage |
| Functions | Firebase Cloud Functions v2 (Node 22) |
| Push | Firebase Cloud Messaging (FCM) |
| AI | Gemini 2.5 Pro via Firebase AI Logic (Vertex AI) |
| Monitoring | Firebase Performance SDK + Sentry |
| Analytics | Firebase Analytics |
| Testing | Vitest |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- A [Firebase](https://firebase.google.com) project with Firestore, Auth, Storage, and Functions enabled
- Vertex AI API enabled (for AI Assistant features)

### Installation

```bash
git clone https://github.com/MRK2340/basketball-referee-manager.git
cd basketball-referee-manager
yarn install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase project configuration. All `VITE_*` values are client-side build configuration (public by design); the only private credential in the project is the CI deploy service account, stored as a GitHub secret.

### Development

```bash
yarn dev           # starts at http://localhost:3000
yarn build         # production build → dist/
yarn preview       # preview the production build
yarn start         # serve dist/ with a minimal static server
yarn lint          # ESLint
yarn typecheck     # TypeScript (tsc --noEmit)
yarn test          # Vitest
```

## CI / CD

Every push and pull request runs the `CI` workflow (lint, typecheck, tests, web + functions build, Firestore/Storage rules validation against the emulator). The `Firebase Hosting` workflow builds on every PR and push: PRs get a 7-day preview channel and merges to `main` deploy to the live channel — both skip cleanly until the deploy credential exists.

- **CI builds** read `VITE_*` values from a GitHub Actions environment named `github` — see [.github/README.md](.github/README.md) for the variable list.
- **Go-live setup and deploys** (functions, rules, deploy credential, branch protection) — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Demo Accounts

The login page offers "Try Demo Account" buttons for `manager@demo.com` and `referee@demo.com`. Their passwords are configured at build time via `VITE_DEMO_MANAGER_PASSWORD` / `VITE_DEMO_REFEREE_PASSWORD` (see `.env.example`).

## Project Structure

```
/
├── src/
│   ├── components/                # Shared layout and feature components
│   │   ├── ui/                    # Radix-based shadcn component library
│   │   ├── AIAssistantPanel.tsx   # Manager AI chat panel
│   │   ├── RefereeAIPanel.tsx     # Referee AI chat panel
│   │   ├── AutoAssignPanel.tsx    # AI-powered referee auto-assignment
│   │   ├── ImportHistoryPanel.tsx # Import history with undo
│   │   ├── SyncStatusIndicator.tsx# Firestore sync / conflict status
│   │   ├── Layout.tsx             # App shell (TopBar + Sidebar + BottomNav)
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Firebase Auth + MFA/TOTP
│   │   ├── DataContext.tsx        # Global data and action hooks
│   │   └── ThemeContext.tsx
│   ├── hooks/                     # Custom hooks (sync status, presence, …)
│   ├── lib/
│   │   ├── firebase.ts            # Firebase initialization + persistence
│   │   ├── firestore/             # Firestore CRUD, queries, imports
│   │   ├── firestoreService.ts    # Barrel re-export of lib/firestore
│   │   ├── aiAssistant.ts         # Manager AI (Gemini 2.5 Pro)
│   │   ├── refereeAiAssistant.ts  # Referee AI (Gemini 2.5 Pro)
│   │   ├── bracketUtils.ts        # Bracket generation algorithms
│   │   ├── scheduleImportParsers.ts # CSV/Excel/PDF parsing
│   │   ├── validation.ts          # Input validation utilities
│   │   ├── mappers.ts             # Firestore → UI data mappers
│   │   ├── types.ts               # Core TypeScript interfaces
│   │   └── logger.ts              # Sentry integration
│   ├── pages/                     # Route components (Dashboard, Schedule, …)
│   └── __tests__/                 # Vitest suites
├── functions/                     # Cloud Functions (FCM, rate limiting,
│                                  #   reminders, public referee profile)
├── docs/DEPLOYMENT.md             # Go-live runbook
├── firestore.rules                # Firestore security rules
├── storage.rules                  # Storage security rules
├── firestore.indexes.json         # Composite indexes
└── firebase.json                  # Firebase project configuration
```

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/about` | Public | About |
| `/contact` | Public | Contact |
| `/referee/:id` | Public | Public referee profile |
| `/dashboard` | All users | Dashboard |
| `/schedule` | All users | Game schedule |
| `/games` | All users | Game history + independent log + import |
| `/calendar` | All users | Availability calendar |
| `/payments` | All users | Payment history |
| `/messages` | All users | Messaging |
| `/profile` | All users | User profile |
| `/settings` | All users | Settings (privacy, notifications, security, 2FA) |
| `/help` | All users | Help Center (FAQ) |
| `/analytics` | All users | Performance analytics |
| `/game-report` | Referee only | Submit game report |
| `/find-managers` | Referee only | Find and connect with managers |
| `/manager` | Manager only | Tournament management, brackets, AI assistant |

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User accounts and profile data |
| `tournaments` | Tournament definitions |
| `games` | Scheduled games |
| `game_assignments` | Referee-to-game assignments |
| `game_reports` | Post-game reports |
| `payments` | Referee payment records |
| `messages` | User messages |
| `notifications` | In-app notifications |
| `referee_availability` | Referee availability dates |
| `referee_ratings` | Manager ratings of referees |
| `manager_connections` | Manager-referee roster connections |
| `independent_games` | Referee self-logged games |
| `tournament_brackets` | Bracket data (real-time sync) |
| `live_game_sessions` | Live scoring sessions |
| `_import_history` | Schedule/game import tracking |
| `_ai_chat_history` | AI assistant conversation persistence |
| `_game_reminders` | Push notification scheduler (server-only) |
| `_fcm_tokens` | Push tokens (server-read only) |
| `_audit_log` | Security audit trail |
| `_rate_limits` | Message rate limiting (server-only) |
| `_payment_info` | Per-user payment details |
| `_feedback` | User feedback (write-only) |
| `_meta` | Seed guard |

Access to every collection is enforced by [`firestore.rules`](firestore.rules).

## License

Private — all rights reserved.
