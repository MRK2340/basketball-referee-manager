# iWhistle Basketball Referee Manager — Product Definition Requirements (PDR)

## 1. Purpose
This PDR defines a clean rebuild direction for iWhistle, a basketball referee management application for youth and AAU basketball organizations. It should be used as the starting blueprint before rebuilding screens, data models, Firebase services, and release plans.

The goal is to rebuild from a simple, reliable core first, then add advanced automation, analytics, AI, and notification features only after the scheduling workflow is stable.

## 2. Product Vision
Create a mobile-first referee operations platform that helps assignors and referees manage games with less manual coordination, fewer missed assignments, and clearer communication.

### Product Promise
- Managers can create games, assign referees, resolve conflicts, and track coverage quickly.
- Referees can see assignments, manage availability, accept or decline games, and track payments from one place.
- Both roles get a calm, trustworthy, real-time experience designed for high-pressure game-day operations.

## 3. Target Users

### Primary Users
1. **League Managers / Assignors**
   - Own schedules, tournaments, rosters, assignments, payments, and communication.
   - Need fast tools for bulk scheduling, conflict detection, replacement coverage, and game-day changes.

2. **Referees**
   - Manage availability, assignments, reports, messages, and earnings.
   - Need a simple mobile experience with clear next actions.

### Secondary Users
1. **Tournament Directors**
   - Need high-level visibility into staffing, standings, brackets, and issues.

2. **Parents, coaches, or public viewers**
   - Optional future users for public standings, schedules, and referee profile pages.

## 4. Core Problems to Solve
- Managers spend too much time manually assigning referees and chasing confirmations.
- Referees miss updates when assignments change close to game time.
- Availability, conflicts, payments, and reports are often tracked in separate tools.
- Tournament weekends require fast replacement workflows and reliable mobile access.
- Historical assignment, performance, and payment records are hard to audit.

## 5. Clean-Start Principles
Use these principles to avoid rebuilding the app as an overloaded feature set from day one.

1. **Scheduling first**: games, availability, assignments, and confirmations are the core product.
2. **Mobile-first**: referee workflows must work comfortably on a phone.
3. **Role clarity**: every screen should clearly serve manager, referee, or shared workflows.
4. **Small data model**: start with essential collections and add optional modules later.
5. **Real-time where it matters**: use live updates for assignments, messages, and notifications; avoid unnecessary listeners elsewhere.
6. **Audit important actions**: assignment changes, payment changes, role changes, and account changes should be traceable.
7. **Progressive enhancement**: AI, analytics, imports, brackets, and public pages should come after the core operations loop is dependable.

## 6. MVP Scope

### MVP Must Have
- Authentication for managers and referees.
- Role-based dashboard and navigation.
- Manager roster management.
- Game creation and editing.
- Referee availability management.
- Assignment creation, acceptance, and decline.
- Conflict warnings for overlapping games and unavailable referees.
- Basic in-app notifications for assignment changes.
- Basic messaging between managers and referees.
- Payment tracking status: unpaid, pending, paid.
- Post-game report submission.
- Responsive layout for mobile and desktop.

### MVP Should Have
- CSV import for games.
- Calendar and list schedule views.
- Manager assignment board by date or tournament.
- Referee earnings summary.
- Export of games and payment records.
- Basic Firebase security rules and indexes.

### MVP Will Not Have Initially
- AI assistant.
- Voice input.
- Advanced analytics dashboards.
- Public referee profiles.
- Complex bracket editing.
- Offline-first support beyond default browser behavior.
- Push notifications until in-app notifications are stable.
- Multi-tenant billing/subscriptions.

## 7. User Journeys

### Manager Journey: Staff a Game
1. Manager logs in.
2. Manager creates or imports games.
3. Manager opens the assignment board.
4. System shows eligible referees and conflict warnings.
5. Manager assigns one or more referees.
6. Referees receive notifications.
7. Referees accept or decline.
8. Manager sees coverage status and finds replacements if needed.

### Referee Journey: Accept Assignment
1. Referee logs in on mobile.
2. Referee sees upcoming games and pending assignment requests.
3. Referee opens assignment details.
4. Referee accepts or declines.
5. If declining, referee optionally provides a reason.
6. Dashboard updates with confirmed schedule.

### Referee Journey: Manage Availability
1. Referee opens availability calendar.
2. Referee marks available, unavailable, or limited availability.
3. Manager assignment views use that availability immediately.
4. Referee can edit future availability as plans change.

### Manager Journey: Close Out Payments
1. Manager opens payments.
2. Manager filters by date range, tournament, referee, or payment status.
3. Manager marks assignments paid individually or in bulk.
4. Referee sees updated payment status and earnings summary.

## 8. Information Architecture

### Public Routes
- Landing page
- Login
- Register
- Forgot password
- Help / contact

### Referee Routes
- Dashboard
- Schedule
- Availability calendar
- Games and reports
- Payments
- Messages
- Notifications
- Profile
- Settings

### Manager Routes
- Dashboard
- Games
- Assignment board
- Tournaments
- Roster
- Availability overview
- Payments
- Reports
- Messages
- Notifications
- Settings

## 9. Data Model — Clean Start

### Required Collections
- `users`
  - Profile, role, contact information, account status, preferences.
- `manager_referee_connections`
  - Relationship between managers and referees.
- `tournaments`
  - Tournament metadata and date ranges.
- `games`
  - Game schedule, teams, location, level, tournament linkage, status.
- `assignments`
  - Game-to-referee assignments, role, status, fee, payment status.
- `availability`
  - Referee availability records by date/time window.
- `messages`
  - Direct manager-referee communication.
- `notifications`
  - In-app notification feed.
- `game_reports`
  - Incident reports, notes, scores, and follow-up status.
- `audit_logs`
  - Sensitive system events and administrative changes.

### Optional Later Collections
- `imports`
- `brackets`
- `standings`
- `referee_ratings`
- `push_tokens`
- `ai_action_logs`
- `public_profiles`

## 10. Roles and Permissions

### Referee
- Read own profile, assignments, messages, notifications, availability, payments, and reports.
- Create and update own availability.
- Accept or decline own assignments.
- Create reports for assigned games.
- Update limited profile and notification settings.

### Manager
- Manage own tournaments, games, roster connections, assignments, payments, and reports.
- Message connected referees.
- Read availability for connected referees.
- Cannot silently change referee account ownership or identity.

### Admin / Future Platform Owner
- Manage tenants, support issues, abuse reports, and global configuration.
- Should be out of MVP unless required.

## 11. UX Requirements

### Overall Design
- Use the iWhistle identity: clean white space, confident blue, restrained orange accents, and readable typography.
- Prioritize clarity over decoration.
- Use status chips, cards, and simple tables for operational data.
- Preserve fast access to the next important action.

### Mobile Requirements
- Bottom navigation for primary referee routes.
- Large tap targets for accept, decline, message, and call actions.
- Sticky game-day summary on referee dashboard.
- Avoid dense tables on small screens; use cards instead.

### Desktop Requirements
- Sidebar navigation for manager workflows.
- Assignment board should use split panes or responsive tables.
- Bulk actions should be available only when selected rows are clear.

### Accessibility Requirements
- Keyboard navigable forms and dialogs.
- Visible focus states.
- Semantic buttons and labels.
- Sufficient color contrast.
- Status information should not rely on color alone.

## 12. Functional Requirements

### Authentication
- Email and password login.
- Role assigned at registration or invitation.
- Password reset.
- Session persistence.

### Games
- Managers can create, edit, cancel, and archive games.
- Games support date, start time, end time, venue, court, teams, level, and tournament.
- Game status values: draft, open, assigned, confirmed, completed, cancelled.

### Assignments
- Managers can assign referees to games.
- Referees can accept or decline assignments.
- System detects double-booking and unavailable windows.
- Assignment status values: pending, accepted, declined, removed, completed.

### Availability
- Referees can create availability blocks.
- Availability supports all-day and timed windows.
- Managers can view availability for connected referees.

### Messages
- Users can send direct messages within connected manager-referee relationships.
- Messages show read/unread state.
- Assignment-related messages can link to a game.

### Notifications
- Assignment created.
- Assignment changed.
- Assignment accepted.
- Assignment declined.
- Message received.
- Payment marked paid.

### Payments
- Managers can set game fees.
- Managers can mark assignments as unpaid, pending, or paid.
- Referees can view earnings by date range.

### Reports
- Referees can submit post-game reports.
- Managers can review and resolve reports.

## 13. Non-Functional Requirements

### Performance
- Initial authenticated app load should target under 3 seconds on average broadband.
- Lists should paginate or limit reads when data grows.
- Avoid loading all historical games by default.

### Reliability
- Assignment writes should be atomic where possible.
- Conflicts should be checked before assignment creation.
- Critical changes should create audit log records.

### Security
- Firestore rules must enforce role and ownership checks.
- Users must not be able to escalate their own role.
- Payment and report data must be scoped to authorized users.
- Input validation should happen on client and server/rules where practical.

### Privacy
- Store only necessary personal information.
- Provide user data export and account deletion in a later phase.
- Do not expose referee contact details publicly by default.

## 14. Suggested Rebuild Phases

### Phase 0 — Foundation
- Confirm product scope and data model.
- Set up Vite, React, TypeScript, Tailwind, Firebase, routing, linting, and tests.
- Build shared UI components and layout shells.

### Phase 1 — Auth and Roles
- Implement login, register, protected routes, user profiles, and role-based navigation.

### Phase 2 — Games and Availability
- Implement game CRUD.
- Implement referee availability.
- Build schedule views.

### Phase 3 — Assignments
- Implement assignment board.
- Add accept/decline flow.
- Add conflict detection.
- Add basic notifications.

### Phase 4 — Communication and Reports
- Implement messages.
- Implement game reports.
- Add report resolution workflow.

### Phase 5 — Payments and Exports
- Implement payment status tracking.
- Add earnings summary.
- Add CSV export.

### Phase 6 — Hardening
- Add Firestore rules, indexes, audit logs, error boundaries, loading states, and regression tests.

### Phase 7 — Advanced Features
- Add imports, bracket tools, analytics, push notifications, AI assistant, public profiles, and offline support.

## 15. Success Metrics
- 90% of assignment requests are accepted or declined inside the app.
- Managers can assign referees to a full game day without using spreadsheets.
- Referees can find their next game in under 10 seconds on mobile.
- Assignment conflict rate decreases over time.
- Payment status disputes decrease because assignment and payment records are centralized.

## 16. Open Questions
- Will the product support multiple leagues or one organization at launch?
- Should referees join by invitation only, or can they request manager connections?
- What payment workflow is required: tracking only, export for payroll, or direct payments?
- Which schedule import formats are required for the first release?
- Are tournaments required for MVP, or can games exist independently first?
- Who owns account support and role correction?

## 17. Definition of Done for Clean Start
The rebuild is ready for MVP testing when:
- Managers can create games and assign referees.
- Referees can manage availability and respond to assignments.
- Assignment conflicts are visible before confirmation.
- Notifications and messages support basic coordination.
- Payments and reports have simple working flows.
- Security rules prevent unauthorized cross-user access.
- Core flows pass automated tests and a manual mobile smoke test.
