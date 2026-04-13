#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository. Initialize git before running security checks."
  exit 1
fi

echo "Running tracked-file secret checks..."

# .env files should never be tracked (except .env.example)
tracked_env_files="$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -Ev '(^|/)\.env\.example$' || true)"
if [ -n "$tracked_env_files" ]; then
  echo "ERROR: Tracked .env file detected. Keep env files local-only."
  echo "$tracked_env_files"
  exit 1
fi

# Local credential dumps should never be tracked
tracked_credential_json="$(git ls-files | grep -Ei '(service-account|credentials).*\.json$|(^|/)icgc-praise-temple-.*\.json$' || true)"
if [ -n "$tracked_credential_json" ]; then
  echo "ERROR: Tracked credential JSON detected."
  echo "$tracked_credential_json"
  exit 1
fi

# Known high-risk secret signatures in tracked files
if git --no-pager grep -nEI \
  'BEGIN (RSA |EC )?PRIVATE KEY|BEGIN PRIVATE KEY|AIza[0-9A-Za-z_-]{20,}|GMAIL_APP_PASSWORD=[^[:space:]]+|DATABASE_URL=postgres(ql)?://[^[:space:]]+:[^[:space:]@]+@' \
  -- . ':(exclude).env.example' ':(exclude)scripts/security-scan.sh' ':(exclude)scripts/security-history-check.sh' >/dev/null; then
  echo "ERROR: Secret-like values found in tracked files."
  exit 1
fi

echo "Tracked-file secret checks passed."
