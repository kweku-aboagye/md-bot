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

/**
 * Returns a GoogleAuth instance using the service account credentials
 * stored in GOOGLE_SERVICE_ACCOUNT_JSON.
 *
 * Called fresh each time — GoogleAuth caches the token internally
 * and handles renewal automatically. No manual token management needed.
 */
export function getGoogleAuth(): ReturnType<typeof google.auth.fromJSON> extends never
  ? never
  : InstanceType<typeof google.auth.GoogleAuth> {
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

  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  }) as any;
}

/** Google Docs client (v1) */
export async function getDocsClient() {
  const auth = getGoogleAuth();
  return google.docs({ version: 'v1', auth: auth as any });
}

/** Google Sheets client (v4) */
export async function getSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth: auth as any });
}
