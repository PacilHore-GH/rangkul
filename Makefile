models-download:
	cd backend && python -m app.ai_runtime.bootstrap --download

models-verify:
	cd backend && python -m app.ai_runtime.bootstrap --verify-only

dev:
	docker compose up --build

dev-ai-fake:
	docker compose up --build

test:
	cd backend && python -m pytest

test-integration:
	cd backend && python -m pytest -m integration

test-model-smoke:
	cd backend && set RUN_MODEL_SMOKE_TESTS=1 && python -m pytest -m model_smoke

lint:
	cd frontend && npm run lint

migrate:
	echo Apply backend/migrations/versions SQL using your migration runner.
