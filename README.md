# EventBuddy

Office events for a company, plus a Forward Deployed Engineer console for each client workspace. The browser app runs on the in-memory mock store until Supabase is configured. Docker is not required for `npm run dev`.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5175/. This app uses port 5175 only.

Copy `.env.example` to `.env` and set `VITE_USE_MOCK=true`. In development, the login page has a collapsed Demo accounts section for `admin@eventbuddy.com`, `staff@eventbuddy.com`, and `fde@eventbuddy.com`. Passwords live only in `VITE_MOCK_ADMIN_PASSWORD`, `VITE_MOCK_STAFF_PASSWORD`, and `VITE_MOCK_FDE_PASSWORD`. Those buttons render only when `import.meta.env.DEV` or `VITE_USE_MOCK=true`. The account role decides the home page.

## Design system

Shared pieces live in `src/components/ui` and `src/components/common`: PageHeader, StatCard, Badge, Avatar, DataTable, EmptyState, Skeleton, ConfirmDialog, Modal, Drawer, Toast, Tabs, Progress, Tooltip, IconButton, RelativeTime, and ErrorBoundary. Tokens are in `src/assets/styles/variables.css`. Primary actions are indigo. Red is reserved for the logo mark and destructive actions.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite on port 5175 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` for the TypeScript contract in `src/lib/database.types.ts` |
| `npm run test` | Vitest for analytics, waitlist, networking isolation, and calendar export |
| `npm run test:e2e` | Playwright. Needs `npx playwright install chromium`. Does not exercise login. |
| `npm run build` | Production build, including the PWA manifest |

## Mock store and Supabase

The mock store in `src/mock/store.js` is the default. Services call Supabase only when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set and `VITE_USE_MOCK` is not `true`. Copy `.env.example` to `.env` for those public values. `.env` is gitignored.

Never put a service-role key in a `VITE_` variable. Edge functions read `SUPABASE_SERVICE_ROLE_KEY` from function secrets.

```
Browser (Vite, React)
  mock store                         when Supabase env is empty
  supabase-js + TanStack Query       when URL and anon key are set
        |
Supabase Postgres (RLS) + Realtime + Edge Functions
```

Chat and notifications use Realtime when the client is configured, and the mock store otherwise.

## What is on hold

Google and Microsoft sign-in stay disabled until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Email and password work in mock mode from `.env`.

## Database and edge functions

Source of truth:

- `supabase/migrations/20261116000100_schema.sql` — tables
- `supabase/migrations/20261116000200_rls.sql` — helpers and policies
- `supabase/migrations/20261116000300_functions.sql` — waitlist, analytics RPCs, provisioning, Vault reads
- `supabase/seed.sql` — Northwind and Contoso, no users and no passwords
- `supabase/tests/rls_isolation.sql` — tenant A cannot read or write tenant B
- `supabase/functions/` — invite, CSV import, Slack, Google Calendar, OIDC, webhooks, reminders, FDE impersonation. Outlook and Teams are stubs.

Apply them with the Supabase CLI against Docker (`supabase start`) or a cloud project (`supabase db push`). `npm run dev` does not apply them.

In the Supabase dashboard, after you choose to turn login back on, you still need to:

- Create the project and run the migrations
- Add the anon key and URL to `.env` (anon key only)
- Set function secrets: `SUPABASE_SERVICE_ROLE_KEY`, and later `RESEND_API_KEY` for email
- Enable Vault before integration secrets can be stored
- Create an `imports` storage bucket for CSV files
- Schedule `send-reminders` with `pg_cron` using the snippet at the bottom of the functions migration
- Enable Realtime on `chat_messages` and `notifications` if the publication step was skipped

`app_role` is the JWT claim for admin/staff/fde. The Postgres `role` claim stays `authenticated` so it does not replace the database role.

## Product behavior on the mock store

Admins can create and edit events, including a recurrence rule. Staff can RSVP, land on a waitlist when an event is full, get promoted when a seat opens, export `.ics`, check in from the event QR, leave feedback, and use chat and networking suggestions. FDE pages cover clients, the onboarding checklist, integration health, config versions with rollback, an impersonation banner, and adoption numbers.
