# HGH Gap Module

## Purpose

Compares the HGH YouTube playlist against linked recordings in the HGH sheet to determine which playlist videos have never been ministered.

## Source Files

- `finder.ts` computes the read-only gap analysis
- `service.ts` exposes the shared send path for scheduled and manual runs
- `email.ts` contains the single shared report email format
- `routes.ts` mounts the gap endpoints

## Matching Rules

- exact YouTube video ID matching
- sheet links are read from both `Current` and `Archives`
- link extraction supports inserted hyperlinks, rich text links, chips, formulas, and raw URLs

## Routes

- `GET /api/hgh/status`
- `POST /api/test/hgh-gap-tracker`

## Schedule

- Monday `9 AM CT` for the scheduled gap report

## Important Behavior

- dashboard status, scheduled reports, and manual trigger emails all use the same gap finder result
- the manual trigger is now a preview of the exact report cron will send on Monday
- the actual email send path is the shared mailer in `server/core/email/mailer.ts`
- if production is configured for `Resend`, both the Monday cron job and the manual dashboard trigger send through Resend

## Manual Testing

- `npm run dev`
- `GET /api/hgh/status`
- `POST /api/test/hgh-gap-tracker`
- confirm the returned JSON result matches the counts shown in the email
