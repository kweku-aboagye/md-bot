# Praise & Worship Module

## Purpose

Reads the P&W Google Doc for the target Sunday week, validates each required section, exposes read-only status, and sends reminder emails when sections are incomplete.

## Source Files

- `document-reader.ts` parses the Google Doc
- `validator.ts` computes section status and sends reminder emails
- `service.ts` owns status, Sundays listing, and validation runs
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
- `GET /api/sundays`
- `POST /api/test/pw-reminder`
- `POST /api/pw/validate`

## Schedule

- Mon–Sat `9 AM CT`
- Mon–Sat `5 PM CT`

## Persistence

- writes actual sent reminder emails to the shared `email_history` table
- `GET /api/history` reads the latest stored email history rows

## Manual Testing

- `npm run dev`
- `GET /api/pw/status`
- `POST /api/test/pw-reminder`
- verify `GET /api/history` records the sent reminder emails
