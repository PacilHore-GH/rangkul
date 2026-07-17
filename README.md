# Rangkul

Rangkul is a FastAPI and Next.js workspace. This version adds the first production-oriented multimodal Development Journal checkpoint foundation.

## Local Development

```bash
cp .env.example .env
docker compose up --build
```

Open the frontend at `http://localhost:3000` and API docs at `http://localhost:8000/docs`.

## Checkpoint Flow

1. Fetch checkpoint templates.
2. Create a consented checkpoint for a `PersonProfile`.
3. Complete the private asset upload lifecycle.
4. Submit the checkpoint.
5. Read structured results and the Indonesian professional-review draft.
6. Approve or request recapture through the review API.

## Models

Model files are not committed. See `backend/model_manifest.yaml` and `docs/runbooks/model-bootstrap.md`.

```bash
make models-verify
```

Local development defaults to `AI_USE_FAKE_MODELS=true` for deterministic tests and UI work.
