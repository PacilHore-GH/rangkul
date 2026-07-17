# Rangkul

**Bersama untuk tumbuh, pulih, dan berdaya.**

Rangkul is an Indonesian, privacy-first care companion for families and professionals supporting people with special needs. It uses one TanStack Start application, Supabase Auth/PostgreSQL/Storage, deterministic support tools, and server-only Groq integrations.

## Local setup

1. Install [Bun](https://bun.sh/) and run `bun install`.
2. Copy `.env.example` to `.env.local` and provide a Supabase project. Never expose service-role or Groq keys through `VITE_*` variables.
3. Apply the migrations in `supabase/migrations` and optionally run the idempotent demo seed documented in `supabase/seed.sql`.
4. Run `bun run dev`.

## Review gate

```sh
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun test
bun run build
```

The application is decision support, not a diagnosis, prescription, emergency, or guaranteed-outcome system. Demo records are synthetic and clearly labeled.
