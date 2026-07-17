# CI/CD setup

The workflows deploy the monorepo independently after CI succeeds. Add these GitHub Actions secrets:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN` (a Railway Project Token for the production environment)
- `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, and `RAILWAY_ENVIRONMENT_NAME` (normally `production`)

Create a Vercel project with `frontend` as its root directory. Set the server-side
`BACKEND_URL` to `https://<railway-service-domain>` in both Preview and Production.
The browser calls the same-origin `/api/v1` route and Next.js proxies it to Railway,
so the HttpOnly session cookie is not treated as a third-party cookie.

Create an empty Railway service, then use the service settings to generate a public domain. If the
service is connected directly to GitHub, set its Root Directory to `/backend`; otherwise Railway
uses the repository root as the Docker build context and cannot find `app/`. The backend deployment
workflow uploads only `backend/`, and Railway builds its `Dockerfile`. Set these service variables
in Railway:

- `APP_NAME=Rangkul Backend API`
- `DEBUG=False`
- `CORS_ORIGINS=https://<production-frontend-domain>`
- `CORS_ORIGIN_REGEX=^https://.*\\.vercel\\.app$`
- `DATABASE_URL=<Supabase Session Pooler connection string>`
- `JWT_SECRET_KEY=<random production secret>`
- `COOKIE_SECURE=True`
- `COOKIE_SAMESITE=lax`
- `FRONTEND_URL=https://<production-frontend-domain>`
- `TRUSTED_ORIGINS=["https://<production-frontend-domain>"]`
- `CSRF_ENABLED=True`
- `MAILER_BACKEND=console` hanya untuk demo; ganti adapter provider sebelum production

`backend/railway.toml` defines the Docker build, health check at `/api/v1/health`, and restart
policy. In the Railway service settings, set the config-file path to `/backend/railway.toml` if the
service is connected to the GitHub repository; the GitHub Actions deployment already uploads this
file at the backend root. Configure branch protection in GitHub to require the `CI` workflow before
merging to `main`.
