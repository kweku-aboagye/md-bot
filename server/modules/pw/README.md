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
- reminders stop once the Wednesday `12 PM CT` music deadline passes — after the
  band has rehearsed, nothing a leader adds reaches them

## No Service Section

When the document has no dated heading inside the target week there are no
sections to check, so no leader can be reminded. Rather than logging an error and
sending nothing, the run notifies `PRAISE_AND_WORSHIP_EMAILS` (+ `ADMIN_EMAIL`) —
the same routing as the missing-leader alert, since creating the dated heading is
a job for whoever maintains the document — on the same deadline ladder and with
the same cut-off at the Wednesday deadline as every other reminder.

## Persistence

- writes actual sent reminder emails to the shared `email_history` table

## Email Delivery

- reminder emails use the shared mailer in `server/core/email/mailer.ts`
- reminder HTML is built through the shared responsive reminder template in `server/core/email/reminder-template.ts`
- manual and scheduled P&W runs use the same provider configuration
- on Railway, that should normally be `Resend`
- missing-leader alerts: `PRAISE_AND_WORSHIP_EMAILS` (comma-separated) + `ADMIN_EMAIL` always appended
- leader reminders (missing songs/links): sent directly to the leader email parsed from the Google Doc

## SMS Delivery

- sent after a successful email delivery
- missing-leader: group members' phones looked up from `phone_contacts` DB by matching `PRAISE_AND_WORSHIP_EMAILS`; `ADMIN_PHONE` env var used directly for admin
- leader reminder: leader's phone looked up from `phone_contacts` DB by matching their email from the doc
- SMS is silently skipped when Twilio env vars are not configured

## Manual Testing

- `npm run dev`
- `GET /api/pw/status`
- `POST /api/test/pw-reminder`
- verify the reminder route returns a successful result when ministry data is incomplete
