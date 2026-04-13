#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository. Initialize git before running history checks."
  exit 1
fi

echo "Running git-history secret checks..."

# Check whether sensitive file names ever existed in history
if git rev-list --objects --all | grep -Eiq '(^| )(.*/)?(\.env(\..*)?|icgc-praise-temple-.*\.json|.*service-account.*\.json|.*credentials.*\.json)$'; then
  echo "ERROR: Sensitive file names found in git history."
  exit 1
fi

# Check history diffs for common secret signatures
if git --no-pager log --all -G 'BEGIN (RSA |EC )?PRIVATE KEY|BEGIN PRIVATE KEY|GOOGLE_SERVICE_ACCOUNT_JSON=|GMAIL_APP_PASSWORD=|YOUTUBE_API_KEY=AIza|DATABASE_URL=postgres' --pretty=format:%H -- . ':(exclude)scripts/security-scan.sh' ':(exclude)scripts/security-history-check.sh' | grep -q .; then
  echo "ERROR: Secret-like content found in git history."
  exit 1
fi

echo "Git-history secret checks passed."
