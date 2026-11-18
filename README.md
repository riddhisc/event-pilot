# Event Pilot

## Plan. Track. Connect.

Make every company event effortless.

Event Pilot is an office events app with dedicated experiences for admins, staff, and Forward Deployed Engineers (FDEs). It runs on an in-memory mock store by default, with a Supabase implementation available when you are ready to turn it on.

## Features by role

### Admin

- Create, edit, duplicate, publish, cancel, and complete events
- Manage capacity, waitlists, recurring events, and staff invitations
- Review attendance, feedback, participation, and no-show reports
- Manage workspace notifications and event operations

### Staff

- Browse upcoming and past events
- RSVP, join waitlists, check in, and leave feedback
- Export calendar events and use event chat
- Discover colleagues through department, interest, and shared-event matching

### FDE console

- Manage client workspaces and onboarding checklists
- Review adoption, support, integrations, and configuration health
- Compare configuration versions and roll back changes
- Impersonate a client workspace with a visible safety banner

## Tech stack

- React 19 and React Router
- Vite 6 with the React and PWA plugins
- TanStack Query, Zustand, React Hook Form, Zod, and Recharts
- Vitest, Testing Library, and Playwright
- Supabase migrations, RLS policies, RPCs, and Edge Functions (written but off by default)

## Run it locally

Dependencies are installed in the existing checkout. Copy `.env.example` to `.env`, set the mock passwords, then run:

```bash
npm run dev
```

Open http://localhost:5175/. The app uses port 5175 by default.

The local demo accounts use `admin@eventbuddy.com`, `staff@eventbuddy.com`, and `fde@eventbuddy.com`. These legacy demo emails are intentionally unchanged because the mock store and login logic depend on them. Passwords come from `VITE_MOCK_ADMIN_PASSWORD`, `VITE_MOCK_STAFF_PASSWORD`, and `VITE_MOCK_FDE_PASSWORD`.

The mock passwords are `VITE_` variables, so Vite includes them in the client bundle. Use demo-only passwords; never use production credentials.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Starts Vite on port 5175 |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Runs `tsc --noEmit` for the TypeScript contract |
| `npm run test` | Runs Vitest for analytics, waitlists, networking isolation, and calendar export |
| `npm run test:e2e` | Runs Playwright; Chromium may need to be installed in a fresh CI environment |
| `npm run build` | Creates the production Vite build and PWA assets |

## Mock store vs Supabase

The mock store in `src/mock/store.js` is the default. Services call Supabase only when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set and `VITE_USE_MOCK` is not `true`. `.env` is gitignored and is not deployed automatically.

Never put a service-role key in a `VITE_` variable. Supabase Edge Functions read `SUPABASE_SERVICE_ROLE_KEY` from function secrets.

```text
Browser (Vite, React)
  mock store                         when Supabase env is empty
  supabase-js + TanStack Query       when URL and anon key are set
        |
Supabase Postgres (RLS) + Realtime + Edge Functions
```

Chat and notifications use Realtime when the client is configured, and the mock store otherwise.

## Database and edge functions

The Supabase source of truth is kept in:

- `supabase/migrations/20261116000100_schema.sql` — tables
- `supabase/migrations/20261116000200_rls.sql` — helpers and policies
- `supabase/migrations/20261116000300_functions.sql` — waitlist, analytics RPCs, provisioning, and Vault reads
- `supabase/migrations/20261116000400_section1_fixes.sql` — follow-up database fixes
- `supabase/seed.sql` — Northwind and Contoso seed data, with no users or passwords
- `supabase/tests/rls_isolation.sql` — tenant isolation checks
- `supabase/functions/` — invites, CSV imports, Slack, Google Calendar, OIDC, webhooks, reminders, and FDE impersonation

Apply them with the Supabase CLI against Docker (`supabase start`) or a cloud project (`supabase db push`). `npm run dev` does not apply them.

## What is on hold

Google and Microsoft sign-in stay disabled until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Email and password work in mock mode from `.env`. Outlook and Teams integrations remain stubs.

## Live demo

Live demo: [Event Pilot demo](https://example.com/event-pilot)

## Screenshots

Add product screenshots here before publishing:

- `docs/screenshots/admin-dashboard.png`
- `docs/screenshots/staff-networking.png`
- `docs/screenshots/fde-onboarding.png`

## Deploy to Vercel

Vercel uses the Vite preset, runs `npm run build`, serves `dist`, and rewrites application routes to `index.html` so refreshes do not return a 404. Vercel installs dependencies during the deployment; no local reinstall is needed.

Add these environment variables in the Vercel project settings:

```text
VITE_USE_MOCK=true
VITE_MOCK_ADMIN_PASSWORD=<demo-only-admin-password>
VITE_MOCK_STAFF_PASSWORD=<demo-only-staff-password>
VITE_MOCK_FDE_PASSWORD=<demo-only-fde-password>
```

`.env` is gitignored and is not deployed to Vercel. The four values above must be added to Vercel manually. Because they are `VITE_` variables, these passwords are exposed in the browser bundle and are only suitable for a demo deployment.

## Repo rename

After renaming the GitHub repository to `event-pilot`, update the local remote:

```bash
git remote set-url origin https://github.com/riddhisc/event-pilot.git
git remote -v
```

Suggested GitHub repository description:

> Plan, track, and connect around effortless company events.

Suggested topics:

`event-management` `react` `vite` `supabase` `office-events` `rsvp` `pwa` `vercel`
