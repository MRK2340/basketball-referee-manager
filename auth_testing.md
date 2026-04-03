# Auth & Demo Testing Notes

## App structure in this recreation
- The app runs as a single Vite project from the repository root.
- Environment variables are read from the root `.env` file when used.
- There is no `/frontend/.env` path in this recreated repo layout.

## Demo accounts
- Manager: `manager@demo.com` / `password`
- Referee: `referee@demo.com` / `password`

## Recommended smoke test flow
1. Open `/login`
2. Use **Try Demo Account**
3. Log in as referee and verify dashboard, schedule, messages, payments, and calendar
4. Request an open game from the **Open Games** tab
5. Sign out, log in as manager, and verify the request in **Management**

## Data behavior
- App data is stored in browser localStorage for this recreation
- Auth session and seeded demo flows persist within the same browser context