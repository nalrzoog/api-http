# Flowers Knot — لوحة إدارة العملاء والمناسبات

Full-stack app: React + TypeScript + Vite frontend, backed entirely by Supabase
(Auth, Postgres, Row Level Security). No mock data, no localStorage persistence —
every screen reads and writes real Supabase data.

## Setup

```bash
cd app
npm install
cp .env.example .env   # fill in your project's URL + anon key
npm run dev
```

`.env` needs:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Never put the `service_role` key in this file or anywhere in frontend code.

## Structure

```
src/
  lib/         supabase client, formatting/date helpers, dashboard aggregation
  services/    authService.ts, clientService.ts — all Supabase calls live here
  hooks/       useAuth (session/profile context), useClients (CRUD + local state)
  types/       shared TS types (Client, Profile, enums)
  components/  route guards, app shell/nav, KPI cards, charts, modals
  pages/       Login, Register, ForgotPassword, ResetPassword, Dashboard, Clients
```

## Backend (Supabase)

- **profiles** — one row per registered user, auto-created by a database
  trigger (`handle_new_user`) on `auth.users` insert.
- **clients** — client/event records; `remaining_amount` and `payment_status`
  are Postgres *generated* columns, always computed, never sent by the client.
- **RLS** — every `clients`/`profiles` policy checks `user_id = auth.uid()` /
  `id = auth.uid()`. A user can never see, edit, or delete another user's data.
- **10-user cap** — enforced inside `handle_new_user()` with an advisory lock
  (`pg_advisory_xact_lock`) so two simultaneous signups can't both slip in as
  #10 and #11. The frontend also pre-checks via the `get_registered_user_count`
  RPC for a clean Arabic message before even attempting signup.

See the project's migration history in Supabase for the exact SQL.
