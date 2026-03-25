# Basketball Referee Manager

A web application for managing AAU youth basketball leagues. Referees can view their schedule, track payments, log availability, and communicate with managers. Managers can create tournaments, schedule games, assign referees, and review game reports.

## Features

**Referees**
- View assigned games and upcoming schedule
- Accept or decline game assignments
- Request to officiate open games
- Log availability on a calendar
- Track payment history
- Submit post-game reports
- Message the league manager

**Managers**
- Create and manage tournaments
- Schedule games and assign referees to courts
- Find replacement referees for declined assignments
- Review game reports
- Manage referee roster and profiles

**Both roles**
- Responsive UI — mobile bottom-nav, desktop sidebar
- Real-time notifications
- Performance analytics dashboard
- Account and preference settings

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS + Radix UI (shadcn components) |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Supabase (Postgres + Auth) |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js `20.19.1` (see `.nvmrc`)
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/MRK2340/basketball-referee-manager.git
cd basketball-referee-manager

# Use the correct Node version (nvm users)
nvm use

npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev        # starts at http://localhost:3000
npm run build      # production build → dist/
npm run preview    # preview the production build
npm run lint       # run ESLint
```

## Demo Accounts

On first load, two demo accounts are seeded automatically:

| Role | Email | Password |
|---|---|---|
| Manager | `manager@demo.com` | `password` |
| Referee | `referee@demo.com` | `password` |

> **Note:** Auth is simulated via localStorage. A live Supabase connection is required for game data, assignments, payments, and messages.

## Project Structure

```
src/
├── components/               # Shared layout and route components
│   ├── ui/                   # Radix-based shadcn component library
│   ├── Layout.jsx             # App shell (TopBar + Sidebar + BottomNav)
│   ├── LoadingSpinner.jsx
│   ├── ProtectedRoute.jsx
│   └── PublicRoute.jsx
├── contexts/
│   ├── AuthContext.jsx        # Auth state — login / register / logout
│   └── DataContext.jsx        # Global data and action hooks
├── hooks/
│   ├── useDataFetching.js     # Parallel Supabase queries on load
│   ├── useAssignmentActions.js
│   ├── useAvailabilityActions.js
│   ├── useGameActions.js
│   ├── useMessageActions.js
│   ├── useReportActions.js
│   └── useTournamentActions.js
├── pages/
│   ├── Dashboard.jsx
│   ├── Schedule/              # Game schedule with tabs and search
│   ├── Calendar/              # Availability calendar
│   ├── Games.jsx              # Game history and analytics
│   ├── Manager/               # Manager-only tools
│   ├── Payments.jsx
│   ├── Messages.jsx
│   ├── Profile.jsx
│   ├── Settings/
│   ├── GameReport.jsx
│   ├── PerformanceAnalytics.jsx
│   └── LandingPage.jsx
├── lib/
│   └── customSupabaseClient.js
└── App.jsx                    # Route definitions
```

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/dashboard` | All users | Dashboard |
| `/schedule` | All users | Game schedule |
| `/games` | All users | Game history |
| `/calendar` | All users | Availability calendar |
| `/payments` | All users | Payment history |
| `/messages` | All users | Messaging |
| `/profile` | All users | User profile |
| `/settings` | All users | Settings |
| `/analytics` | All users | Performance analytics |
| `/game-report` | Referee only | Submit game report |
| `/manager` | Manager only | Management tools |
