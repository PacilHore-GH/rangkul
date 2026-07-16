# Facility Navigator MVP

## Scope

The navigator implements the PRD's public facility discovery flow:

- Search by name, service, and region.
- Filter by category, BPJS, online booking, age, and accessibility.
- Optional browser geolocation with a maximum 100 km radius.
- User-location marker after explicit “Di sekitar saya” permission.
- List and OpenStreetMap views; the list remains usable without the map.
- Open driving directions in Google Maps without an API key.
- Facility details with source, verification, and freshness labels.
- Save facilities in browser storage, compare 2–4 facilities, and report incorrect information.

Frontend routes:

- `/app/services/search`
- `/app/services/compare?ids=<id>,<id>`
- `/app/services/<facility-id>`

API routes under `/api/v1`:

- `GET /facilities`
- `GET /facilities/{id}`
- `POST /facilities/compare`
- `POST /facilities/{id}/report`

Swagger documents the accepted search parameters and validation rules at `/docs`.

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

The included records are visibly fictional demonstration data. They must not be used to make care decisions. Source validity and stale-state behavior are implemented, but the catalog and correction reports currently reset when the backend restarts.

After the shared auth/PostgreSQL foundation is merged, replace the in-memory catalog with the PRD `facilities` and `facility_services` tables, persist correction reports with audit fields, and associate saved facilities with the authenticated account. Keep the public API response shape so the frontend does not need to change.
