# AI Care Companion → Rangkul transplant audit

## Repositories and baseline

- Read-only donor: `../ai-care-companion` at `bf49de2f8af83ae29b7dc7f5075e081ed774e9ce` (`Pacil-Hore/ai-care-companion`).
- Target: this repository at `32e15abafbf2e01365d831b281d992b961cf0c7f` (`PacilHore-GH/rangkul`).
- Implementation branch: `feat/ai-care-companion-rangkul-overhaul`. No donor Git data or environment files will be copied.

## Donor architecture

- TanStack Start + React 19 + Vite 8 + TypeScript, Bun, Tailwind CSS 4, Radix primitives, TanStack Query, Zod, and Supabase.
- Entrypoints are `src/start.ts`, `src/server.ts`, `src/router.tsx`, and generated `src/routeTree.gen.ts`.
- File routes provide `/`, `/auth`, and authenticated `/beranda`, `/onboarding`, `/roadmap`, `/jurnal`, `/asisten`, `/layanan`, and `/pengaturan` behind `src/routes/_authenticated/route.tsx`.
- Supabase Auth is attached through TanStack middleware. PostgreSQL migrations create profiles, people, roadmap items, chat messages, and journals with owner-scoped RLS.
- Reusable UI includes a responsive `AppShell`, brand components, and a broad Radix-based component library.
- Server functions validate input, resolve the session, call Supabase, and use a server-only OpenAI-compatible AI gateway. RAG uses a small curated Indonesian knowledge base and lexical retrieval.

## Existing Rangkul target

- Split Next.js frontend and FastAPI/SQLAlchemy backend, Docker Compose, Celery-style AI workers, PostgreSQL/Alembic, npm, Playwright/Vitest/Pytest, Vercel frontend deployment, and Railway backend deployment.
- Existing workflows expect `frontend/**` and `backend/**` and secrets such as Vercel and Railway identifiers. They are incompatible with the root TanStack application and must be replaced.
- Retain the generated `frontend/public/auth-hero-cover.png` as `public/images/rangkul-auth-hero.png`, useful multimodal concepts/tests (DTW, trends, pose mapping, checkpoint privacy), and concise security/AI documentation where still accurate.
- Preserve `.git`, remote/history, GitHub metadata as adapted, the license, and secret files if present. No local target secret files were detected before branching.

## Replacement scope

- Overwrite/remove the legacy `frontend/`, `backend/`, Docker Compose files, Makefile, old scripts, framework-specific deployment files, package metadata, and obsolete documentation.
- Transplant donor root configuration, `src/`, `public/`, and Supabase setup, excluding `.git`, `.env*`, dependencies, caches, build output, coverage, local databases, and temporary media.
- Keep one package manager (`bun`) and one TanStack/Supabase runtime. Adapt CI to install, lint, typecheck, test, and build from the repository root.

## Compatibility risks

- The donor schema is only an initial owner-only model; roles, person access, consent, catalog data, checkpoints, professional workflows, and storage policies need additive migrations and tested RLS.
- Existing Python multimodal code cannot remain as a second runtime; its deterministic ideas must be ported to typed TypeScript utilities.
- MediaPipe requires browser APIs and graceful model/camera failure states. Real Groq/Supabase smoke tests depend on credentials and cannot be claimed without them.
- Route generation, SSR/client Supabase behavior, Vercel root configuration, and Bun lockfile consistency must be verified after transplant.

## Exact plan

1. Commit this audit on the clean target feature branch.
2. Preserve the Rangkul authentication illustration and selected reference documentation; remove the legacy dual-stack product.
3. Copy the donor application explicitly into the target root and re-establish a runnable Bun/TanStack baseline.
4. Complete Rangkul identity, auth/onboarding, eight product routes, normalized persistence, authorization/RLS, seed data, and dashboard aggregation.
5. Port deterministic aid, trend, DTW, graph-feature, and event-segmentation logic to TypeScript; add privacy-first checkpoint server functions and structured Groq summaries.
6. Polish shared responsive states, adapt CI/deployment documentation, run the focused gate, commit staged changes, push, and open a draft PR without merging.
