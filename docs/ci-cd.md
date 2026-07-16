# CI/CD setup

The workflows deploy the monorepo independently after CI succeeds. Add these GitHub Actions secrets:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN` (a Railway Project Token for the production environment)
- `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, and `RAILWAY_ENVIRONMENT_NAME` (normally `production`)

Create a Vercel project with `frontend` as its root directory. Set `NEXT_PUBLIC_API_URL` to
`https://<railway-service-domain>/api/v1` in both Preview and Production.

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

`backend/railway.toml` defines the Docker build, health check at `/api/v1/health`, and restart
policy. In the Railway service settings, set the config-file path to `/backend/railway.toml` if the
service is connected to the GitHub repository; the GitHub Actions deployment already uploads this
file at the backend root. Configure branch protection in GitHub to require the `CI` workflow before
merging to `main`.
