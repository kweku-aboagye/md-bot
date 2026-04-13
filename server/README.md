# MD Bot Server

Backend runtime for MD Bot. The server is now organized into:

- `core/` for shared runtime concerns: config, Google access, email, DB, HTTP composition, logging, scheduling, and utilities
- `modules/` for business features: `pw`, `celestial`, `hgh-selection`, `hgh-gap`, and `zamar`

## Commands

- `npm run dev` starts the API in development mode on port `5001` by default
- `npm run build` compiles the server into `dist/server`
- `npm run start` runs the compiled API in production mode
- `npm run check` runs TypeScript without emitting files
- `npm run security:check` runs tracked-file + git-history secret checks before publishing

## GitHub Publishing Safety

- Copy root `.env.example` to local `.env` and fill your own values.
- Keep `.env` and local credential JSON files untracked; do not commit them.
- Run `npm run security:check` before your first public push.

## Environment Variables

Required for normal operation:

- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `DATABASE_URL`

Required for HGH gap tracking:

- `YOUTUBE_API_KEY`

Required for email delivery, choose one:

- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- `GMAIL_USER` and `GMAIL_APP_PASSWORD`

Optional:

- `PORT` default `5001`
- `EMAIL_PROVIDER` set to `resend` or `gmail`; if omitted, MD Bot auto-detects `resend` first, then Gmail SMTP
- `DASHBOARD_PIN` protects `/api/test/*`
- `ADMIN_EMAIL` used by `/api/test/send-email`, P&W missing-leader alerts, HGH reminder/report delivery, and included in Celestial/Zamar notifications
- `CELESTIAL_NOTIFICATION_EMAILS` comma-separated non-admin recipients for Celestial alerts; `ADMIN_EMAIL` is always included automatically
- `ZAMAR_BAND_EMAILS` comma-separated non-admin recipients for Zamar prep emails; `ADMIN_EMAIL` is always included automatically
- `ADMIN_PIN` legacy body-based PIN for `/api/*/validate`

## Railway Note

- Railway `Hobby`, `Trial`, and `Free` environments should use an HTTPS email API such as Resend instead of SMTP
- Gmail SMTP is best kept for local development unless your Railway workspace supports outbound SMTP

## Runtime Behavior

- `server/index.ts` boots Express, request logging, route registration, and cron startup
- cron jobs only register when `NODE_ENV === "production"`
- most modules use the shared target-Sunday rule in `core/scheduling/target-sunday.ts`
- successful outgoing ministry emails are persisted in the shared `email_history` table

## Core API Surface

- `GET /health`
- `GET /api/auth/config`
- `GET /api/history` returns recent unified email history rows
- `GET /api/schedule`
- `GET /api/sundays`
- `GET /api/pw/status`
- `GET /api/celestial/status`
- `GET /api/hgh-selection/status`
- `GET /api/hgh/status`
- `GET /api/zamar/status`
- `GET /api/ministry/status`
- `POST /api/test/send-email`
- `POST /api/test/pw-reminder`
- `POST /api/test/celestial-reminder`
- `POST /api/test/hgh-selection-reminder`
- `POST /api/test/hgh-gap-tracker`
- `POST /api/test/zamar-prep`

Legacy body-PIN routes remain for compatibility:

- `POST /api/pw/validate`
- `POST /api/celestial/validate`
- `POST /api/hgh/validate`
- `POST /api/zamar/validate`

## Schedule

- Mon–Sat `9 AM CT`: P&W validation, Celestial check, HGH selection check
- Mon–Sat `5 PM CT`: P&W validation, Celestial check, HGH selection check
- Monday `9 AM CT`: HGH gap report
- Wednesday `12 PM CT`: Zamar prep
