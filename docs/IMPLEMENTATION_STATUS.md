# Rangkul overhaul implementation status

## Architecture and security

Rangkul is one root TanStack Start/React/Vite application using Bun, Supabase Auth/PostgreSQL/Storage, TanStack Query, Zod, and server functions. The former Next.js/FastAPI/Docker split was removed. Groq chat, transcription, and structured reports are server-only; Supabase service-role credentials are never imported into browser modules.

The additive `20260717120000_rangkul_platform.sql` migration introduces roles, practical person access, consent, journal analyses, recommendations/reviews, roadmap goals/tasks, RAG sources/chunks/conversations, facility and aid catalogs, applications, appointments, notifications, indexes, private storage buckets, helper functions, grants, and RLS. Admin catalog access does not grant private-media access.

## Completion matrix

| Feature | UI | Server | Database | Authorization/RLS | Mobile | Demo |
|---|---|---|---|---|---|---|
| Authentication | Complete | Supabase Auth | profiles/roles | session + protected routes | split/compact | safe creation script |
| Person profile & onboarding | Complete | validated functions | people/access/needs/consent | relationship RLS | responsive cards | synthetic profile |
| AI assistant RAG | Complete | Groq + lexical RAG | sources/chunks/conversations/messages | owner RLS | responsive chat | 12 chunks |
| Hospital & therapy navigator | Complete | catalog query/save | facilities/favorites | catalog + owner RLS | cards/map panel | 8 marked records |
| Government aid navigator | Complete | deterministic matcher | programs/assessments/applications | owner/admin RLS | responsive cards | 7 programs |
| Personalized care roadmap | Complete | validated generation/tasks | roadmaps/goals/tasks/recommendations | person RLS | responsive tabs/cards | 3 goals/5 tasks |
| Development journal multimodal | Review-ready | Groq STT + typed checkpoint functions | journals/analyses/reviews/storage | person/consent RLS | device controls fit | synthetic results |
| Family dashboard | Complete | persisted aggregation | cross-domain tables | relationship RLS | responsive cards | connected seed |

“Complete” means implemented for repository review. Real Supabase, Groq, camera, microphone, MediaPipe model loading, signed uploads, and deployment still require configured environments and browser smoke testing.

## Multimodal boundaries

- Voice accepts a short recording, validates duration/type/size, calls Groq Whisper, derives word-rate and phrase-overlap metrics, requests a Zod-validated report with one retry, and never performs speaker identity.
- Facial behavior is labeled “Facial Behavior Observation”; the capture contract permits face presence, requested actions, head pose, and quality—not identity, demographic, disability, or emotion inference.
- Movement utilities implement normalized pose graph features, movement-energy event segmentation, deterministic encoding, and DTW. Supported task codes are `bilateral_arm_raise`, `clap_hands`, `touch_head`, and `sit_to_stand`; the first two are the primary review tasks. `MovementEncoder` permits a future MotionBERT adapter without requiring one.
- Trends require five valid checkpoints on three dates at average quality 0.60 or higher. Results are per-task observations and never causal or a health score.

## Routes

Public routes include `/`, `/auth`, `/auth/login`, `/auth/register`, and `/auth/forgot-password`. Protected routes include `/dashboard`, `/beranda`, `/people`, `/people/$personId`, `/journal`, `/journal/$mode/new`, `/journal/trend`, `/jurnal`, `/roadmap`, `/assistant`, `/asisten`, `/services`, `/layanan`, `/aid`, `/professional`, `/admin`, `/onboarding`, and `/pengaturan`.

## Environment and demo

Copy `.env.example`; browser variables are limited to publishable Supabase values. Server configuration requires `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GROQ_REPORT_MODEL`, and `GROQ_TRANSCRIPTION_MODEL`.

Apply migrations and `supabase/seed.sql`, then run `bun run seed:demo`. The script requires an uncommitted `RANGKUL_DEMO_PASSWORD` of at least 12 characters and optional demo email variables. It idempotently creates one family user, professional, admin, person, professional link, roadmap, journals, three synthetic analyses, milestones, aid assessment, and tracker item. No real password or personal media is committed.

## Known review limitations

- Generated Supabase client types reflect the donor baseline until regenerated against an applied project; additive-table calls are locally isolated and validated with Zod.
- MediaPipe package/model assets are not vendored; camera flows expose explicit browser/model failure states, while deterministic metrics and seeded results keep review possible without models.
- No credentialed AI, database, browser-device, RLS integration, or production deployment smoke test is claimed from this workstation.
- Screenshot capture requires a configured Supabase review environment; the preserved authentication illustration is in `public/images/rangkul-auth-hero.png`.
