# Facility Navigator MVP

## Scope

The navigator implements the PRD's public facility discovery flow:

- Search by name, service, and region.
- Filter by category, BPJS, online booking, age, and accessibility.
- Optional browser geolocation with a maximum 100 km radius.
- User-location marker after explicit browser permission.
- Separate location-only and nearby-search actions, with a reset to the full catalog.
- List and OpenStreetMap views; the list remains usable without the map.
- Open driving directions in Google Maps without an API key.
- Facility details with source, verification, and freshness labels.
- Save facilities in browser storage, compare 2–4 facilities, and report incorrect information.

Frontend routes:

- `/app/services/search`
- `/app/services/compare?ids=<id>,<id>`
- `/app/services/<facility-id>`
- `/admin/facilities`

API routes under `/api/v1`:

- `GET /facilities`
- `GET /facilities/{id}`
- `POST /facilities/compare`
- `POST /facilities/{id}/report`
- `GET /admin/facilities`
- `POST /admin/facilities`
- `PUT /admin/facilities/{id}`
- `PATCH /admin/facilities/{id}/status`
- `GET /admin/facilities/reports`
- `PATCH /admin/facilities/reports/{id}`

Swagger documents the accepted search parameters and validation rules at `/docs`.

## Temporary admin access

The team auth branch is intentionally not duplicated here. Until it is merged, admin endpoints are disabled unless a bootstrap token is configured:

```bash
FACILITY_ADMIN_TOKEN=local-only-secret docker compose up --build
```

Open `/admin/facilities` and enter the same token. The dashboard keeps it only in React memory, so a refresh requires entering it again. Never commit a real token.

After the shared auth branch lands, replace `require_facility_admin` with its authenticated-user dependency and require the Admin role. Delete `FACILITY_ADMIN_TOKEN`, the token entry screen, and this bootstrap section in the same change.

## Local verification

```bash
cd backend
.venv/bin/pytest
.venv/bin/ruff check .

cd ../frontend
pnpm lint
pnpm build
```

## Current data boundary

The included records are visibly fictional demonstration data. They must not be used to make care decisions. Source validity, stale-state behavior, catalog administration, and correction-report moderation are implemented, but all changes currently reset when the backend restarts.

After the shared auth/PostgreSQL foundation is merged, replace the in-memory catalog with the PRD `facilities` and `facility_services` tables, persist correction reports with audit fields, and associate saved facilities with the authenticated account. Keep the public API response shape so the frontend does not need to change.
