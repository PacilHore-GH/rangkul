# ADR-001: Multimodal Checkpoint Engine

## Status
Accepted as the initial implementation direction.

## Repository Audit
The repository is a small starter monorepo. The backend is FastAPI with Pydantic settings and no existing ORM, migration runner, auth layer, object storage abstraction, or queue. The frontend is Next.js with Tailwind CSS and a single demo page. Docker Compose previously ran only backend and frontend.

## Decision
Use the fallback stack requested by the product brief: FastAPI, SQLAlchemy-compatible migrations, PostgreSQL with pgvector, Redis/Celery, S3-compatible storage through MinIO locally, and Next.js/React TypeScript. Public API code does not load heavy AI models; model work is isolated behind `app.ai_runtime` interfaces and worker queues.

## Assumptions
`PersonProfile` is represented by a UUID path parameter until the broader product domain is added. Local development defaults to deterministic fake models (`AI_USE_FAKE_MODELS=true`) so API and UI work without GPU, model weights, or Groq credentials.

## Privacy And Safety
The engine stores observable metrics and fixed-dimension embeddings separately. Raw media is represented by private object keys and must not be sent to Groq. Face embeddings are behavior aggregates only, never identity embeddings. Reports are drafts requiring professional approval and block diagnosis, causal claims, medication guidance, and normal/abnormal language.

## Trade-Offs
The first implementation establishes bounded modules, schemas, endpoints, migrations, fake analyzers, and documentation. Real MediaPipe, Whisper, MotionBERT, and Groq adapters are intentionally behind protocols so they can be enabled after weights, checksums, GPUs, and credentials are available.

## Why VideoMAE Is Excluded
VideoMAE is not needed for the MVP and is explicitly disallowed. Movement analysis uses MediaPipe Pose, deterministic kinematic features, DTW/reference matching, and MotionBERT-Lite embeddings.
