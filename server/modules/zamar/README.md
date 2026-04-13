# Zamar Module

## Purpose

Compiles the target Sunday songs from P&W, HGH, and Celestial, exposes that combined list to the dashboard, and emails the prep list on demand or on schedule.

## Source Files

- `service.ts` compiles songs and sends the prep email
- `email.ts` renders the prep list email
- `routes.ts` mounts Zamar endpoints

## Inputs

- P&W songs from the target Sunday week in the Google Doc
- at most one HGH song from the target Sunday row in the HGH sheet
- at most one Celestial song from the target Sunday row in the Celestial sheet

## Routes

- `GET /api/zamar/status`
- `POST /api/test/zamar-prep`
- `POST /api/zamar/validate`

## Schedule

- Wednesday `12 PM CT`

## Email Delivery

- prep emails use the shared mailer in `server/core/email/mailer.ts`
- manual and scheduled Zamar runs use the same provider configuration
- on Railway, that should normally be `Resend`

## Manual Testing

- `npm run dev`
- `GET /api/zamar/status`
- verify songs are grouped across P&W, HGH, and Celestial
- `POST /api/test/zamar-prep`
