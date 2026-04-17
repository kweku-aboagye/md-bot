# Praise & Worship Module

## Purpose

Reads the P&W Google Doc for the target Sunday week, validates each required section, exposes read-only status, and sends reminder emails when sections are incomplete.

## Source Files

- `document-reader.ts` parses the Google Doc
- `validator.ts` computes section status and sends reminder emails
- `service.ts` owns status and validation runs
- `routes.ts` mounts P&W endpoints

## Data Source

- Google Doc ID from `server/core/config/resources.ts`
- required sections:
  - `Call to Worship`
  - `Worship`
  - `Praise`

## Validation Rules

- `complete`: leader email present, songs present, all songs have YouTube links
- `missing_leader`: no leader email or section absent
- `missing_songs`: leader exists but no songs listed
- `missing_links`: songs exist but one or more links are missing

## Routes

- `GET /api/pw/status`
- `POST /api/test/pw-reminder`

## Schedule

- Mon–Sat `9 AM CT`
- Mon–Sat `5 PM CT`

## Persistence

- writes actual sent reminder emails to the shared `email_history` table

## Email Delivery

- reminder emails use the shared mailer in `server/core/email/mailer.ts`
- reminder HTML is built through the shared responsive reminder template in `server/core/email/reminder-template.ts`
- manual and scheduled P&W runs use the same provider configuration
- on Railway, that should normally be `Resend`

## Manual Testing

- `npm run dev`
- `GET /api/pw/status`
- `POST /api/test/pw-reminder`
- verify the reminder route returns a successful result when ministry data is incomplete
