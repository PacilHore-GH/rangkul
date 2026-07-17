# Deployment

Rangkul deploys as one TanStack Start application on Vercel. Supabase provides
PostgreSQL, authentication, and row-level security. Railway is not required for
the current architecture.

## 1. Create the owned Supabase project

1. Create a project in the team's Supabase organization.
2. Link this repository with the Supabase CLI.
3. Apply every migration in `supabase/migrations`.
4. Regenerate `src/integrations/supabase/types.ts` from the owned project.
5. In Supabase Auth URL configuration, set the production site URL and add the
   production and Vercel preview callback URLs.

## 2. Configure Vercel

Import the repository as a Vercel project and use:

- Framework preset: Other
- Install command: `bun install --frozen-lockfile`
- Build command: `bun run build`
- Output directory: leave empty; Nitro emits the Vercel Build Output API files

Copy the variables from `.env.example` into Vercel. Set them separately for
Production, Preview, and Development when the Supabase projects differ.

Only variables beginning with `VITE_` are public. Never prefix the Supabase
service-role key or AI key with `VITE_`.

## 3. Verify before release

```sh
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run build
```

After deployment, verify signup, login, logout, onboarding, profile isolation,
roadmap generation, assistant responses, journal creation, and aid matching with
two different user accounts.

## AI provider

The server uses an OpenAI-compatible endpoint configured through `AI_API_KEY`,
`AI_BASE_URL`, and `AI_MODEL`. The defaults in `.env.example` target Google's
Gemini OpenAI-compatible endpoint. Changing providers does not require source
changes when the provider supports that protocol.
