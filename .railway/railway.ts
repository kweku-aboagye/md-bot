import { defineRailway, github, preserve, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "md-bot";
export default defineRailway(() => {
  const mdBot = service("md-bot", {
    source: github("kweku-aboagye/md-bot", { branch: "main", checkSuites: false }),
    build: { buildCommand: "npm ci --include=dev && cd client && npm ci --include=dev && cd .. && npm run build", buildEnvironment: "V3", builder: "RAILPACK" },
    start: "npm start",
    healthcheck: "/health",
    healthcheckTimeout: 30,
    replicas: { "us-west2": 1 },
    domains: ["md-bot.app"],
    env: { ADMIN_EMAIL: preserve(), ADMIN_PHONE: preserve(), CELESTIAL_CHOIR_EMAILS: preserve(), CELESTIAL_SHEET_ID: preserve(), DASHBOARD_PIN: preserve(), DATABASE_URL: preserve(), EMAIL_PROVIDER: preserve(), GMAIL_APP_PASSWORD: preserve(), GMAIL_USER: preserve(), GOOGLE_SERVICE_ACCOUNT_JSON: preserve(), HGH_PLAYLIST_ID: preserve(), HGH_SHEET_ID: preserve(), HIS_GLORY_HERALDS_EMAILS: preserve(), NODE_ENV: preserve(), PRAISE_AND_WORSHIP_EMAILS: preserve(), PW_DOC_ID: preserve(), RESEND_API_KEY: preserve(), RESEND_FROM_EMAIL: preserve(), TWILIO_ACCOUNT_SID: preserve(), TWILIO_AUTH_TOKEN: preserve(), TWILIO_FROM_NUMBER: preserve(), YOUTUBE_API_KEY: preserve(), ZAMAR_BAND_EMAILS: preserve(), ZAMAR_DOC_ID: preserve() },
  });

  return project("md-bot", {
    variables: { managed: true },
    resources: [mdBot],
  });
});
