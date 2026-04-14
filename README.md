# iWhistle — AAU Youth Basketball League Manager

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
- Fully typed TypeScript codebase (100+ files migrated)
- Real-time sync across all connected clients (Firestore `onSnapshot`)
- Offline-first with IndexedDB persistence
- Push notifications for game reminders (24h and 1h before)
- Two-factor authentication (TOTP / MFA)
- GDPR-compliant data export and account deletion
- Audit logging for sensitive actions
- Public referee profiles at `/referee/:id`
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
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Functions | Firebase Cloud Functions (Node 22) |
| Push | Firebase Cloud Messaging (FCM) |
| AI | Gemini 2.5 Pro via Firebase AI Logic (Vertex AI) |
| Monitoring | Firebase Performance SDK + Sentry |
| Analytics | Firebase Analytics |
| Testing | Vitest (51 unit/integration tests) |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- A [Firebase](https://firebase.google.com) project with Firestore, Auth, Storage, and Functions enabled
- Vertex AI API enabled (for AI Assistant features)

### Installation

```bash
git clone <your-repo-url>
cd basketball-referee-manager
yarn install
```

### Environment Variables

Create a `.env` file in the project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_SENTRY_DSN=your_sentry_dsn (optional)
```

### Development

```bash
yarn dev           # starts at http://localhost:3000
yarn build         # production build → dist/
yarn preview       # preview the production build
yarn lint          # run ESLint
yarn test          # run Vitest (51 tests)
```

### Firebase Deployment

```bash
firebase deploy --only firestore:rules    # deploy security rules
firebase deploy --only firestore:indexes  # deploy composite indexes
firebase deploy --only functions          # deploy Cloud Functions
firebase deploy --only hosting            # deploy to Firebase Hosting
```

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Manager | `manager@demo.com` | `manager123` |
| Referee | `referee@demo.com` | `Referee123` |

## Project Structure

```
/
├── src/
│   ├── components/                # Shared layout and UI components
│   │   ├── ui/                    # Radix-based shadcn component library
│   │   ├── AIAssistantPanel.tsx   # Manager AI chat panel
│   │   ├── RefereeAIPanel.tsx     # Referee AI chat panel
│   │   ├── AutoAssignPanel.tsx    # AI-powered referee auto-assignment
│   │   ├── ImportHistoryPanel.tsx # Import history with undo
│   │   ├── OfflineIndicator.tsx   # Offline/online status banner
│   │   ├── Layout.tsx             # App shell (TopBar + Sidebar + BottomNav)
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Firebase Auth + MFA/TOTP
│   │   ├── DataContext.tsx         # Global data and action hooks
│   │   └── ThemeContext.tsx
│   ├── hooks/                     # 15 custom hooks (all TypeScript)
│   ├── lib/
│   │   ├── firebase.ts            # Firebase initialization + persistence
│   │   ├── firestoreService.ts    # All Firestore CRUD with validation
│   │   ├── aiAssistant.ts         # Manager AI (Gemini 2.5 Pro)
│   │   ├── refereeAiAssistant.ts  # Referee AI (Gemini 2.5 Pro)
│   │   ├── bracketUtils.ts        # Bracket generation algorithms
│   │   ├── scheduleImportParsers.ts # CSV/Excel/PDF parsing
│   │   ├── validation.ts          # Input validation utilities
│   │   ├── performanceTraces.ts   # Custom Firebase Performance traces
│   │   ├── mappers.ts             # Firestore → UI data mappers
│   │   ├── types.ts               # Core TypeScript interfaces
│   │   └── logger.ts              # Sentry integration
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Schedule/              # Game schedule with tabs and search
│   │   ├── Calendar/              # Availability calendar
│   │   ├── Games/                 # Game history, independent log, import
│   │   ├── Manager/               # Tournaments, assignments, brackets, roster
│   │   ├── Settings/              # Privacy, notifications, security, 2FA
│   │   ├── HelpCenter.tsx         # FAQ and help documentation
│   │   ├── RefereePublicProfile.tsx
│   │   └── LandingPage.tsx
│   └── __tests__/                 # Vitest test suites (51 tests)
├── functions/
│   └── index.js                   # Cloud Functions (FCM, rate limiting, reminders)
├── firestore.rules                # Security rules (deployed)
├── firestore.indexes.json         # Composite indexes (deployed)
└── firebase.json                  # Firebase project configuration
```

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/about` | Public | About |
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
| `/referee/:id` | Public | Public referee profile |
| `/manager` | Manager only | Tournament management, brackets, AI assistant |

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` / `profiles` | User accounts and profile data |
| `tournaments` | Tournament definitions |
| `games` | Scheduled games |
| `game_assignments` | Referee-to-game assignments |
| `game_reports` | Post-game reports |
| `messages` | User messages |
| `notifications` | In-app notifications |
| `refereeAvailability` | Referee availability dates |
| `manager_connections` | Manager-referee roster connections |
| `independent_games` | Referee self-logged games |
| `tournament_brackets` | Bracket data (real-time sync) |
| `_import_history` | Schedule/game import tracking |
| `_ai_chat_history` | AI assistant conversation persistence |
| `_game_reminders` | Push notification scheduler |
| `_audit_logs` | Security audit trail |
| `_rate_limits` | Message rate limiting |

## License

Private — all rights reserved.
