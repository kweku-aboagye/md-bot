/**
 * googleAuth.ts
 *
 * Shared Google service account auth client for the entire app.
 *
 * Replaces the Replit OAuth connector pattern that required
 * REPLIT_CONNECTORS_HOSTNAME / REPL_IDENTITY and broke whenever
 * the Repl slept or restarted.
 *
 * Setup:
 *  1. Create a Google Service Account in Google Cloud Console
 *  2. Download the JSON key file
 *  3. Store the entire JSON as the GOOGLE_SERVICE_ACCOUNT_JSON env var
 *     (paste the full JSON as a single-line string, or Railway handles
 *      multi-line secrets fine too)
 *  4. Share your Google Docs / Sheets with the service account email
 *     (looks like: your-account@your-project.iam.gserviceaccount.com)
 *     — Viewer access is enough, we never write back
 */

import { google } from 'googleapis';
const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

type GoogleAuthInstance = InstanceType<typeof google.auth.GoogleAuth>;

function buildGoogleAuth(): GoogleAuthInstance {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not set. ' +
      'Add your service account JSON as an environment variable.'
    );
  }

  let credentials: object;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. ' +
      'Make sure you pasted the full key file contents.'
    );
  }

  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

let cachedAuth: GoogleAuthInstance | null = null;

/**
 * Returns a GoogleAuth instance using the service account credentials
 * stored in GOOGLE_SERVICE_ACCOUNT_JSON.
 *
 * Reused for the lifetime of the process. GoogleAuth caches its OAuth
 * access token internally and renews it automatically, but only within a
 * single instance — building a fresh instance per call would throw that
 * cache away every time, forcing every Docs/Sheets request to run its own
 * full OAuth token exchange instead of sharing one.
 */
export function getGoogleAuth(): GoogleAuthInstance {
  if (!cachedAuth) cachedAuth = buildGoogleAuth();
  return cachedAuth;
}

const TOKEN_FETCH_RETRIES = 3;
const TOKEN_FETCH_RETRY_BASE_MS = 300;

let authReadyPromise: Promise<void> | null = null;

// Ensures the shared auth instance has an active client/token before it's
// handed to a Docs/Sheets client, retrying transient failures (e.g. a
// dropped connection to the OAuth token endpoint) with backoff. Concurrent
// callers share the same in-flight promise so a burst of requests right
// after a cold start triggers one token exchange, not one per request.
async function ensureAuthReady(auth: GoogleAuthInstance): Promise<void> {
  if (!authReadyPromise) {
    authReadyPromise = (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          await auth.getClient();
          return;
        } catch (err) {
          if (attempt >= TOKEN_FETCH_RETRIES) {
            authReadyPromise = null;
            throw err;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, TOKEN_FETCH_RETRY_BASE_MS * 2 ** attempt)
          );
        }
      }
    })();
  }
  return authReadyPromise;
}

/** Google Docs client (v1) */
export async function getDocsClient() {
  const auth = getGoogleAuth();
  await ensureAuthReady(auth);
  return google.docs({ version: 'v1', auth: auth as any });
}

/** Google Sheets client (v4) */
export async function getSheetsClient() {
  const auth = getGoogleAuth();
  await ensureAuthReady(auth);
  return google.sheets({ version: 'v4', auth: auth as any });
}
