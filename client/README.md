# MD Bot Client

React + Vite frontend for the local MD Bot dashboard.

The dashboard is a responsive web app intended to render cleanly across phone, tablet, laptop, and desktop browser widths.

## Layout

- `src/App.tsx` owns the shell and tab switching
- `src/pages/Overview.tsx` renders all live module status panels
- `src/pages/Schedule.tsx` renders the static cron summary
- `src/components/ui.tsx` holds shared UI components
- `src/AuthContext.tsx` and `src/auth-context.ts` handle the dashboard PIN flow
- `src/index.css` defines global tokens and base element behavior
- `src/dashboard.css` owns the responsive layout system and shared breakpoint behavior

## Responsive Behavior

- The client is browser-first and must remain usable from `320px` mobile widths through large desktop screens.
- Use shared CSS for layout-critical behavior such as grid changes, wrapping rules, spacing, and touch-target sizing. Keep inline styles for truly dynamic values only, such as status colors or progress widths.
- Breakpoint baseline:
  - `480px` for very small phones
  - `768px` for tablet and small laptop transitions
  - `1024px` for wider desktop refinements
- Current layout expectations:
  - app tabs fill the available width on small screens and collapse back to an inline segmented control on larger screens
  - the `Overview` dashboard stacks to one column below tablet widths
  - schedule and email-routing rows stack their metadata on smaller screens instead of relying on fixed-width side columns
  - action buttons and external links wrap cleanly and remain touch-friendly
  - the PIN modal uses viewport gutters and responsive width instead of a fixed dialog size

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

## Responsive Validation

- Check the dashboard in responsive mode at `320`, `375`, `390`, `768`, `1024`, and `1440` widths.
- Verify both `Overview` and `Schedule`, plus loading, error, disabled-button, long-text, expanded-gap-report, and open-PIN-modal states.
- Use this browser baseline before calling the UI pass complete:
  - iOS Safari
  - Android Chrome
  - desktop Chrome
  - desktop Firefox or Safari

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
