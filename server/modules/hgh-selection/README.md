# HGH Selection Module

## Purpose

Checks whether His Glory Heralds has logged a song for the shared target Sunday and sends a reminder only when the target entry is missing.

## Source Files

- `checker.ts` provides the generic date-entry check
- `service.ts` owns status and reminder sending
- `email.ts` builds the reminder body
- `routes.ts` mounts status and manual trigger endpoints

## Data Source

- sheet ID from `server/core/config/resources.ts`
- tab `Current`
- column `A` song title
- column `B` date performed

## Routes

- `GET /api/hgh-selection/status`
- `POST /api/test/hgh-selection-reminder`

## Schedule

- Mon–Sat `9 AM CT`
- Mon–Sat `5 PM CT`

## Email Delivery

- selection reminders use the shared mailer in `server/core/email/mailer.ts`
- selection reminder HTML is built through the shared responsive reminder template in `server/core/email/reminder-template.ts`
- manual and scheduled HGH selection runs use the same provider configuration
- on Railway, that should normally be `Resend`
- recipients: `HIS_GLORY_HERALDS_EMAILS` (comma-separated) + `ADMIN_EMAIL` always appended

## SMS Delivery

- sent after a successful email delivery
- group members: phone numbers looked up from the `phone_contacts` DB table by matching each `HIS_GLORY_HERALDS_EMAILS` address
- admin: `ADMIN_PHONE` env var used directly (no DB lookup required)
- SMS is silently skipped when Twilio env vars are not configured

## Manual Testing

- `npm run dev`
- `GET /api/hgh-selection/status`
- remove the target Sunday title from the sheet and call `POST /api/test/hgh-selection-reminder`
- add the title back and confirm the reminder button would be disabled again
