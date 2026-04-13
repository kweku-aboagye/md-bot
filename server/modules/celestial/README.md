# Celestial Module

## Purpose

Checks whether Celestial Choir has selected a hymn for the shared target Sunday, exposes status for the dashboard, and sends an email only when the hymn is missing.

## Source Files

- `service.ts` reads the sheet and runs the reminder flow
- `email.ts` builds the missing-hymn email
- `routes.ts` mounts Celestial endpoints

## Data Source

- sheet ID from `server/core/config/resources.ts`
- tab `Current`
- row start `2`
- columns:
  - `A` date
  - `B` song link
  - `C` event

## Routes

- `GET /api/celestial/status`
- `POST /api/test/celestial-reminder`
- `POST /api/celestial/validate`

## Schedule

- Mon–Sat `9 AM CT`
- Mon–Sat `5 PM CT`

## Manual Testing

- `npm run dev`
- `GET /api/celestial/status`
- blank the target Sunday hymn in the sheet and call `POST /api/test/celestial-reminder`
- restore the sheet and confirm the status flips back to selected
