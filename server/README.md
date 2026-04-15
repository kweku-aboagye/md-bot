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

## Railway Note

- Railway `Hobby`, `Trial`, and `Free` environments should use an HTTPS email API such as Resend instead of SMTP
- Gmail SMTP is best kept for local development unless your Railway workspace supports outbound SMTP

## Email Delivery Behavior

- `server/core/email/mailer.ts` is the single shared delivery path for all outgoing ministry emails
- manual `/api/test/*` routes and scheduled cron runs both call the same mailer
- if Railway is configured with `EMAIL_PROVIDER=resend`, scheduled production jobs will also send through Resend
- if `EMAIL_PROVIDER` is omitted, the mailer auto-selects `resend` when `RESEND_API_KEY` exists, otherwise Gmail SMTP when Gmail credentials exist
- Gmail SMTP now uses short connection timeouts so broken SMTP config fails quickly instead of hanging request routes

## Railway Deployment Checklist

1. Push or merge the code branch that contains the current server changes.
2. In Railway, set:
   - `NODE_ENV=production`
   - `DATABASE_URL`
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
   - `YOUTUBE_API_KEY`
   - `ADMIN_EMAIL`
   - `DASHBOARD_PIN`
   - `EMAIL_PROVIDER=resend`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
3. Redeploy the service after changing environment variables.
4. Verify:
   - `GET /health`
   - `POST /api/test/send-email`
   - one representative manual module route such as `POST /api/test/hgh-gap-tracker`
5. Confirm the scheduler starts in logs after boot.

## Runtime Behavior

- `server/index.ts` boots Express, request logging, route registration, and cron startup
- cron jobs only register when `NODE_ENV === "production"`
- in production, the server also serves `client/dist` after API route registration
- most modules use the shared target-Sunday rule in `core/scheduling/target-sunday.ts`
- successful outgoing ministry emails are persisted in the shared `email_history` table

## Core API Surface

- `GET /health`
- `GET /api/auth/config`
- `GET /api/schedule`
- `GET /api/pw/status`
- `GET /api/celestial/status`
- `GET /api/hgh-selection/status`
- `GET /api/hgh/status`
- `GET /api/zamar/status`
- `POST /api/test/send-email`
- `POST /api/test/pw-reminder`
- `POST /api/test/celestial-reminder`
- `POST /api/test/hgh-selection-reminder`
- `POST /api/test/hgh-gap-tracker`
- `POST /api/test/zamar-prep`

## Schedule

- Mon–Sat `9 AM CT`: P&W validation, Celestial check, HGH selection check
- Mon–Sat `5 PM CT`: P&W validation, Celestial check, HGH selection check
- Monday `9 AM CT`: HGH gap report
- Wednesday `12 PM CT`: Zamar prep

Every scheduled run above uses the same mailer configuration as the manual dashboard trigger for that module.
