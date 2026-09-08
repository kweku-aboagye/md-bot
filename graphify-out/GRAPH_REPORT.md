# Graph Report - md-bot  (2026-09-08)

## Corpus Check
- Corpus is ~24,748 words - fits in a single context window. You may not need a graph.

## Summary
- 610 nodes · 1315 edges · 24 communities (19 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.88)
- Token cost: 246,735 input · 0 output

## Community Hubs (Navigation)
- React Dashboard UI
- Module Services and Sheet Config
- Ministry Module Concepts
- Reminder Template and Doc Reader
- Database and Email Delivery
- Express Routing and Scheduler
- Project Architecture Docs
- Client Build Tooling
- Google API Integration
- HGH Gap Report and YouTube
- Client App TypeScript Config
- Vite Node TypeScript Config
- Server Package Manifest
- Brand Icons and Favicon
- Root TypeScript Config
- NPM Script Commands
- Runtime Dependencies
- Dev Dependencies
- Zamar Prep Email
- Client TSConfig References
- Drizzle Migration Config
- Twilio SMS Client
- Git History Security Check
- Secret Scanning Script

## God Nodes (most connected - your core abstractions)
1. `log()` - 40 edges
2. `compilerOptions` - 17 edges
3. `formatISODate()` - 17 edges
4. `sendTrackedSms()` - 17 edges
5. `compilerOptions` - 16 edges
6. `runCelestialCheck()` - 16 edges
7. `runZamarPrep()` - 16 edges
8. `getAdminEmail()` - 15 edges
9. `checkHGHSelectionAndNotify()` - 15 edges
10. `Shared Mailer (core/email/mailer.ts)` - 15 edges

## Surprising Connections (you probably didn't know these)
- `email_history Table` --shares_data_with--> `Overview Page`  [AMBIGUOUS]
  server/README.md → client/README.md
- `Vite Dev API Proxy` --semantically_similar_to--> `Production Static Client Serving`  [INFERRED] [semantically similar]
  client/README.md → server/README.md
- `Single-Repo Scope Boundary` --conceptually_related_to--> `Railway Single-Service Deployment`  [AMBIGUOUS]
  AGENTS.md → README.md
- `MD Bot Naming Convention` --conceptually_related_to--> `MD Bot`  [INFERRED]
  AGENTS.md → README.md
- `Overview Page` --references--> `Module Status API Surface`  [INFERRED]
  client/README.md → server/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ministry Modules Share One Delivery Path** — server_readme_pw_module, server_readme_celestial_module, server_readme_hgh_selection_module, server_readme_hgh_gap_module, server_readme_zamar_module, server_readme_mailer, server_readme_email_history [EXTRACTED 1.00]
- **Dashboard PIN Trigger Flow** — client_readme_pin_auth_flow, client_readme_manual_control_surface, server_readme_dashboard_pin, server_readme_test_routes, server_readme_mailer [EXTRACTED 1.00]
- **Email Provider Selection Pattern** — readme_email_provider_autodetection, readme_resend, readme_gmail_smtp, server_readme_gmail_smtp_timeouts, readme_railway_deployment [EXTRACTED 1.00]
- **Shared Email + SMS Notification Pipeline** — server_core_email_mailer_shared_mailer, server_core_email_reminder_template_shared_reminder_template, server_modules_celestial_readme_sms_after_email_pattern, server_modules_celestial_readme_phone_contacts_table, server_modules_celestial_readme_admin_email, server_modules_celestial_readme_resend_provider [EXTRACTED 1.00]
- **Zamar Prep List Song Sources** — server_modules_zamar_readme_song_compilation, server_modules_pw_readme_pw_module, server_modules_hgh_selection_readme_hgh_selection_module, server_modules_celestial_readme_celestial_module, server_modules_zamar_readme_target_sunday [EXTRACTED 1.00]
- **Mon-Sat 9 AM / 5 PM CT Reminder Cadence** — server_modules_celestial_readme_celestial_schedule, server_modules_hgh_selection_readme_hgh_selection_schedule, server_modules_pw_readme_pw_schedule [INFERRED 0.95]
- **Social/Community Link Icon Set** — client_public_icons_bluesky_icon, client_public_icons_discord_icon, client_public_icons_github_icon, client_public_icons_x_icon, client_public_icons_social_icon [INFERRED 0.85]
- **SVG Sprite Reuse Pattern (symbol + viewBox + clipPath defs)** — client_public_icons_iconspritesheet, client_public_icons_symbolusepattern, client_public_icons_bluesky_clip, client_public_icons_bluesky_icon [EXTRACTED 1.00]

## Communities (24 total, 5 thin omitted)

### Community 0 - "React Dashboard UI"
Cohesion: 0.06
Nodes (53): App(), getTargetSunday(), Tab, TABS, AuthContext, AuthCtx, useAuth(), AuthProvider() (+45 more)

### Community 1 - "Module Services and Sheet Config"
Cohesion: 0.11
Nodes (49): CELESTIAL_COL_DATE, CELESTIAL_COL_EVENT, CELESTIAL_COL_SONG, CELESTIAL_SHEET_ID, CELESTIAL_SHEET_TAB, DOCUMENT_ID, getAdminEmail(), getCelestialChoirEmails() (+41 more)

### Community 2 - "Ministry Module Concepts"
Cohesion: 0.06
Nodes (53): Central Resource IDs Config, Shared Mailer (server/core/email/mailer.ts), Shared Responsive Reminder Template, Shared Responsive Report Template, ADMIN_EMAIL Fallback Recipient, ADMIN_PHONE Env Var, CELESTIAL_CHOIR_EMAILS Recipient List, Celestial Module (+45 more)

### Community 3 - "Reminder Template and Doc Reader"
Cohesion: 0.07
Nodes (47): buildReminderEmail(), escapeHtml(), joinTextSections(), ReminderEmailAction, ReminderEmailContent, ReminderEmailOptions, TONES, DatedHeader (+39 more)

### Community 4 - "Database and Email Delivery"
Cohesion: 0.07
Nodes (42): drizzle-orm, nodemailer, pg, db, ensureInternalTables(), pool, emailHistory, phoneContacts (+34 more)

### Community 5 - "Express Routing and Scheduler"
Cohesion: 0.12
Nodes (37): express, registerRoutes(), normalizePhone(), registerSmsSignupRoutes(), signupSchema, ScheduleInfo, log(), ctComponentsToUtc() (+29 more)

### Community 6 - "Project Architecture Docs"
Cohesion: 0.08
Nodes (50): MD Bot Repo Notes, MD Bot Naming Convention, Single-Repo Scope Boundary, worship-flow Repository, Client Entry Script (src/main.tsx), Root Mount Element, Mobile Viewport Meta Tag, App Shell and Tab Switching (+42 more)

### Community 7 - "Client Build Tooling"
Cohesion: 0.05
Nodes (38): dependencies, react, react-dom, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+30 more)

### Community 8 - "Google API Integration"
Cohesion: 0.14
Nodes (23): buildGoogleAuth(), ensureAuthReady(), getDocsClient(), getGoogleAuth(), getSheetsClient(), GoogleAuthInstance, SCOPES, CellLink (+15 more)

### Community 9 - "HGH Gap Report and YouTube"
Cohesion: 0.12
Nodes (19): googleapis, HGH_ARCHIVES_TAB, HGH_YOUTUBE_PLAYLIST_ID, buildReportEmail(), CALL_OUT_TONES, escapeHtml(), joinTextSections(), ReportEmailAction (+11 more)

### Community 10 - "Client App TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 11 - "Vite Node TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 12 - "Server Package Manifest"
Cohesion: 0.12
Nodes (15): description, @types/node, typescript, license, name, version, concurrently, dotenv (+7 more)

### Community 13 - "Brand Icons and Favicon"
Cohesion: 0.23
Nodes (14): Favicon Brand Palette (#818cf8 indigo / #fbbf24 amber / #1f2937 slate / #eef2ff face), MD Bot Favicon Mark, Robot Head Glyph (indigo body, amber antenna, dark eyes), bluesky-clip clipPath Definition, bluesky-icon Symbol (Bluesky butterfly mark), Third-Party Brand Mark Icons (solid #08060d fills), discord-icon Symbol (Discord game controller face), documentation-icon Symbol (document with code brackets) (+6 more)

### Community 14 - "Root TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, baseUrl, esModuleInterop, lib, module, moduleResolution, outDir, rootDir (+5 more)

### Community 15 - "NPM Script Commands"
Cohesion: 0.18
Nodes (11): scripts, build, build:client, check, db:push, dev, dev:all, security:check (+3 more)

### Community 16 - "Runtime Dependencies"
Cohesion: 0.20
Nodes (10): dependencies, dotenv, drizzle-orm, express, googleapis, node-cron, nodemailer, pg (+2 more)

### Community 17 - "Dev Dependencies"
Cohesion: 0.20
Nodes (10): devDependencies, concurrently, drizzle-kit, tsx, @types/express, @types/node, @types/node-cron, @types/nodemailer (+2 more)

### Community 18 - "Zamar Prep Email"
Cohesion: 0.42
Nodes (7): buildSongRow(), buildZamarPrepEmail(), escapeHtml(), formatSunday(), groupLabel(), ZamarPrepResult, ZamarSong

## Ambiguous Edges - Review These
- `Single-Repo Scope Boundary` → `Railway Single-Service Deployment`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to
- `Overview Page` → `email_history Table`  [AMBIGUOUS]
  server/README.md · relation: shares_data_with
- `Target Sunday Rule` → `HGH Gap Report Module`  [AMBIGUOUS]
  server/README.md · relation: implements
- `Missing-Hymn Reminder Email` → `email_history Table Persistence`  [AMBIGUOUS]
  server/modules/pw/README.md · relation: shares_data_with
- `Shared Responsive Report Template` → `Zamar Prep List Email`  [AMBIGUOUS]
  server/modules/zamar/README.md · relation: semantically_similar_to
- `Favicon Brand Palette (#818cf8 indigo / #fbbf24 amber / #1f2937 slate / #eef2ff face)` → `UI Accent Icons (stroked #aa3bff, 1.35 width, round caps)`  [AMBIGUOUS]
  client/public/favicon.svg · relation: semantically_similar_to

## Knowledge Gaps
- **192 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 207 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Single-Repo Scope Boundary` and `Railway Single-Service Deployment`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Overview Page` and `email_history Table`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Target Sunday Rule` and `HGH Gap Report Module`?**
  _Edge tagged AMBIGUOUS (relation: implements) - confidence is low._
- **What is the exact relationship between `Missing-Hymn Reminder Email` and `email_history Table Persistence`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Shared Responsive Report Template` and `Zamar Prep List Email`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Favicon Brand Palette (#818cf8 indigo / #fbbf24 amber / #1f2937 slate / #eef2ff face)` and `UI Accent Icons (stroked #aa3bff, 1.35 width, round caps)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `log()` connect `Express Routing and Scheduler` to `Module Services and Sheet Config`, `Reminder Template and Doc Reader`, `Database and Email Delivery`, `HGH Gap Report and YouTube`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._