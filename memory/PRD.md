# PRD - Basketball Referee Manager Recreation

## Original problem statement
Review the GitHub repository and recreate.

## User choices
- Rebuild the full app as closely as possible
- Match the GitHub codebase closely
- Clean up weak areas during recreation

## Architecture decisions
- Preserved the original React + Vite frontend structure and routes
- Replaced the unavailable Supabase dependency with a browser localStorage data layer so the app works end-to-end in this environment
- Kept demo auth/accounts and recreated cross-role referee/manager flows with persistent seeded data
- Added testability improvements with data-testid coverage on primary auth, nav, tabs, schedule, and messaging flows

## What has been implemented
- Working landing page, login/register, role-gated routing, dashboard, schedule, payments, messages, calendar, profile, analytics, and manager tools
- Local persistent demo data service for tournaments, games, assignments, payments, messages, availability, and game reports
- Referee flow: demo login, view schedule, request open games, manage messages, view payments, update availability
- Manager flow: demo login, view management tabs, tournaments, assignments, referee roster, and reports
- Cleanup fixes: removed console warning sources in toast/message markup, added auth/testing docs, added credentials file

## Prioritized backlog
### P0
- Add richer data-testid coverage to remaining secondary dialogs/forms
- Replace external image dependencies with locally hosted assets for more stable previews

### P1
- Implement manager actions currently labeled as coming soon (delete tournament, reply/forward message, export payments)
- Add deeper assignment workflows such as replacement finding and assignment conflict handling UI

### P2
- Reconnect to a real backend/Supabase project when credentials are available
- Add notification center interactions and stronger analytics visualizations

## Next tasks
- Expand remaining test instrumentation across secondary routes
- Polish manager assignment/replacement workflows
- Swap remote branding images for bundled assets and refine small UI inconsistencies
