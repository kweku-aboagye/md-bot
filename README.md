# MD Bot

MD Bot is a local-first automation assistant for the Music Director workflow at ICGC Praise Temple TX.

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

## Useful commands

- `npm run check` — TypeScript checks
- `npm run build` — build server TypeScript output
- `npm run security:check` — run tracked-file and git-history secret checks

## Documentation

- Server docs: [`server/README.md`](server/README.md)
- Client docs: [`client/README.md`](client/README.md)
