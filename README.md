# MD Bot

MD Bot is a local-first automation assistant for the Music Director workflow at ICGC Praise Temple TX.

It runs as a single Express + React app, reads Google Docs and Sheets with a service account, and sends ministry emails through a shared delivery layer that can use either Resend or Gmail SMTP.

## What this repo contains

- `server/` — Express + TypeScript backend for scheduling checks, Google Docs/Sheets reads, and email notifications
- `client/` — React + Vite dashboard for status, schedule, and manual trigger flows
- `scripts/` — security guardrails for tracked-file and git-history secret checks

## Quick start

1. Copy `.env.example` to `.env` and fill in your local values.
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```
3. Run backend + frontend together:
   ```bash
   npm run dev:all
   ```
4. Open `http://localhost:3000`.

## Production Notes

- Railway serves the built React client and the Express API from the same service.
- Cron jobs only start when `NODE_ENV=production`, so local development uses manual trigger routes instead.
- Manual trigger routes and scheduled jobs both use the same shared email delivery code.
- For Railway deployments, prefer `Resend` via `EMAIL_PROVIDER=resend`.
- Gmail SMTP is still supported, but it depends on the host allowing outbound SMTP.

## Email Delivery

- `Resend` is the recommended production provider.
- `Gmail SMTP` is still useful for local development.
- If `EMAIL_PROVIDER` is unset, MD Bot auto-detects `resend` first when `RESEND_API_KEY` is present, then falls back to Gmail SMTP when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set.
- The same provider configuration is used by:
  - dashboard test routes
  - scheduled cron runs
  - any shared module service that sends ministry email

## Useful commands

- `npm run check` — TypeScript checks
- `npm run build` — build server TypeScript output
- `npm run security:check` — run tracked-file and git-history secret checks

## Documentation

- Server docs: [`server/README.md`](server/README.md)
- Client docs: [`client/README.md`](client/README.md)
- Module docs:
  - [`server/modules/pw/README.md`](server/modules/pw/README.md)
  - [`server/modules/celestial/README.md`](server/modules/celestial/README.md)
  - [`server/modules/hgh-selection/README.md`](server/modules/hgh-selection/README.md)
  - [`server/modules/hgh-gap/README.md`](server/modules/hgh-gap/README.md)
  - [`server/modules/zamar/README.md`](server/modules/zamar/README.md)
