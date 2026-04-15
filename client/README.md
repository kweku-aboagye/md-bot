# MD Bot Client

React + Vite frontend for the local MD Bot dashboard.

## Layout

- `src/App.tsx` owns the shell and tab switching
- `src/pages/Overview.tsx` renders all live module status panels
- `src/pages/Schedule.tsx` renders the static cron summary
- `src/components/ui.tsx` holds shared UI components
- `src/AuthContext.tsx` and `src/auth-context.ts` handle the dashboard PIN flow

## Tabs

- `Overview`
  - Praise & Worship
  - Celestial Choir
  - His Glory Heralds selection
  - Zamar band
  - HGH gap report
- `Schedule`
  - Mon–Sat `9 AM CT`: P&W, Celestial, HGH selection
  - Mon–Sat `5 PM CT`: P&W, Celestial, HGH selection
  - Monday `9 AM CT`: HGH gap report
  - Wednesday `12 PM CT`: Zamar prep

## Production Behavior

- the dashboard is a manual control surface for the same backend services used by the scheduler
- `/api/test/*` routes trigger the real server-side module flows, not mock previews
- email success in the dashboard depends on the server's configured provider, which is typically `Resend` on Railway
- the client itself does not talk to Resend directly

## Commands

- `npm run dev` starts the client on `http://localhost:3000`
- `npm run build` creates the production bundle in `client/dist`
- `npm run lint` runs the client ESLint config

## Local Development

The Vite dev server proxies `/api/*` requests to the Express server at `http://localhost:5001`.

From the repo root, run both apps together with:

```bash
npm run dev:all
```

## Auth Model

- the client calls `GET /api/auth/config`
- when `pinRequired` is true, trigger buttons prompt for `DASHBOARD_PIN`
- the client sends that PIN as `x-dashboard-pin` to `/api/test/*`
- long-running manual triggers can still fail if the server-side provider configuration is missing or invalid
