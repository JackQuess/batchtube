# BatchTube Station

BatchTube Station is the unified public + authenticated product hub for docs, feedback, roadmap, templates, provider status, incidents, known issues, changelog, discussions, and global search.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component primitives
- Lucide React
- Supabase + PostgreSQL
- Supabase Auth

## Quick Start

1. Copy envs:
   - `cp .env.example .env.local`
2. Set values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (only for privileged server-side ops)
   - `NEXT_PUBLIC_APP_URL`
3. Install and run:
   - `npm install`
   - `npm run dev`

## Supabase Setup

Run SQL files in order:

1. `supabase/migrations/0001_station_schema.sql`
2. `supabase/seed.sql`

## Notes

- Server Components are default; client components are used only for interactive forms/votes/filter controls.
- `/admin/*` is role-guarded (`moderator` or `admin`).
- If Supabase env vars are missing, list pages still render using embedded mock fallback data.
