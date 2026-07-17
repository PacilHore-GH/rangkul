# Rangkul — Hackathon MVP Build Plan

Selaras dengan `00_README`, `01_BRAND_AND_PRODUCT`, `02_DESIGN_SYSTEM`, `03_UX_AND_CONTENT`, `04_FRONTEND_IMPLEMENTATION_RULES`, `05_COMPONENTS_AND_PATTERNS`, dan PRD MVP. Prioritas hackathon: **flow end-to-end yang bekerja > kejelasan > aksesibilitas > responsif > konsistensi visual**. Tidak menginvensi fitur di luar dokumen.

## Bahasa & role
- **UI Bahasa Indonesia** (override jawaban sebelumnya — mengikuti dokumen).
- Role akun yang dibangun: **Family Member/Caregiver** saja. Professional & Admin didokumentasikan di `future-roles.ts` untuk slide, tidak dibangun.
- Cared-for person = **Person Profile** (bukan role akun). Satu caregiver bisa punya >1 profil (MVP: mendukung banyak profil, dengan "profil aktif" di header).

## Scope MVP (4 fitur utama + 1 opsional)
Menyesuaikan prioritas asli kamu (ungu = AI wow, teal = utilitas):

1. **Auth + Person Profile onboarding** (utilitas) — email/password, wizard 4 langkah membuat Person Profile pertama.
2. **Personalized Care Roadmap** (AI wow #1) — LLM → langkah minggu ini, target bulanan, rekomendasi terapi awal, tampil sebagai checklist yang bisa dicentang. Label "hasil bersifat awal".
3. **AI Assistant + RAG** (AI wow #2) — knowledge base kurasi manual 15 dokumen (WHO, Kemenkes, panduan tumbuh-kembang). Chat single-thread persist di DB, jawaban selalu dengan **sources** + limitation note + fallback state.
4. **Facility & Aid Navigator** (utilitas) — dua sub-halaman dalam satu section nav "Layanan": Hospital/Terapi/SLB navigator + Government Aid navigator. Data dummy terkurasi (~12 fasilitas Indonesia + 6 program bantuan: KIS/PBI-JK/PKH/Kartu Penyandang Disabilitas dll). Aid pakai **rule engine deterministik** sederhana (bukan AI); AI hanya boleh menjelaskan hasil. Label "kecocokan awal bantuan".
5. **Development Journal** (opsional, dipotong pertama kalau waktu mepet) — teks + mood tag + tanggal.

Dashboard = overview ringkas per aturan `05_COMPONENTS_AND_PATTERNS` §Dashboard: profil aktif, next action, aktivitas jurnal terbaru, target roadmap aktif, shortcut ke AI. Tanpa chart dekoratif.

## Design system (implementasi persis dari dokumen)
`src/styles.css` — token semantic (Tailwind v4 `@theme inline`), tanpa hex acak di JSX:

```
--color-brand-primary: #347A69  (hover #2C695B, pressed #24584D)
--color-brand-accent:  #F2A64A  (aksen hangat, bukan body text)
--color-bg-canvas:     #F7F3EA
--color-bg-surface:    #FFFFFF
--color-bg-subtle:     #EEF4F1
--color-bg-inverse:    #21483E
--color-text-primary:  #21483E
--color-text-secondary:#5F776F
--color-border-default:#D8E0DC
--color-focus:         #2E78A6
--color-success/warning/error/info per dokumen
```

- Font: **Plus Jakarta Sans** via `<link>` di `__root.tsx`, fallback Inter/system-ui. Weight: 400/500/600 saja.
- Skala tipografi Display/H1/H2/H3/Body Large/Body/Label/Caption sesuai tabel.
- Spacing 4/8/12/16/20/24/32/40/48/64. Radius 8/12/16/24/999. Border tipis > shadow tebal. Motion 150–250ms ease-out, respect `prefers-reduced-motion`. Target 44×44 min. Focus ring selalu tampak.
- Icon: **Lucide outline** saja, stroke 2, ukuran 16/20/24. **Tidak ada** Sparkles sebagai identitas AI (larangan brand: no puzzle piece, no medical cross, no AI sparkles).
- Logo: karena dokumen melarang regenerate logo dan belum ada asset di project, saya pakai wordmark "Rangkul" (Plus Jakarta Sans Semibold, warna brand-primary) sebagai placeholder mark + simbol lingkaran + hati sederhana yang dibuat inline SVG (bukan generated image). Kamu bisa swap dengan asset resmi kapan saja.

## App shell
- **Desktop**: sidebar kiri (Beranda, Roadmap, Asisten AI, Layanan, Jurnal, Pengaturan) + page header (title, konteks profil aktif, 1 primary action) + main.
- **Mobile**: top app bar tipis + bottom nav 5 destinasi utama.
- Setiap halaman berbasis data punya state: loading (skeleton), empty (copy sesuai contoh dokumen), success, error, plus AI-generating / AI-unavailable untuk fitur AI.

## Backend (Lovable Cloud)
Tabel:
- `profiles` — id (fk auth.users), display_name, created_at
- `person_profiles` — id, owner_id (fk profiles), display_name, age, support_summary (text), support_needs (text[]), emergency_contact_name, emergency_contact_phone, active (boolean), created_at, updated_at
- `roadmaps` — id, person_profile_id, owner_id, generated_at, ai_model, disclaimer_version
- `roadmap_items` — id, roadmap_id, owner_id, category ('weekly'|'monthly'|'therapy'), title, description, target_date (nullable), status ('open'|'done'), order_index
- `chat_messages` — id, owner_id, person_profile_id, role, content, sources jsonb, created_at
- `journal_entries` (opsional) — id, person_profile_id, owner_id, entry_date, content, mood_tag, created_at

RLS: setiap row scoped `auth.uid() = owner_id`. Trigger auto-buat `profiles` row saat signup. GRANT eksplisit ke `authenticated`, tidak ke `anon`.

Server functions (`createServerFn` + `requireSupabaseAuth`):
- `getActivePersonProfile`, `createPersonProfile`, `updatePersonProfile`, `setActivePersonProfile`
- `generateRoadmap(personProfileId)` — panggil Lovable AI (google/gemini-3.5-flash) dengan `Output.object` schema kecil (weekly[], monthly[], therapy[]), insert roadmap + items. Selalu sertakan disclaimer "hasil bersifat awal, diskusikan dengan tenaga profesional".
- `toggleRoadmapItem(itemId)`
- `chatWithAssistant(text)` — retrieve top-3 knowledge chunks (skor keyword overlap sederhana dari `src/lib/knowledge-base.ts`), build prompt dengan system rule ("bukan diagnosis, cite sumber, gunakan bahasa dapat-dipertimbangkan"), panggil Gemini, simpan user+assistant messages, return `{content, sources}`.
- `matchAidPrograms(personProfileId)` — rule engine deterministik di `src/lib/aid-rule-engine.ts` (input: usia, jenis dukungan, kondisi ekonomi opsional) → daftar program dengan status `cocok_awal | perlu_data_tambahan | belum_cocok` + `missing_requirements[]`. **Tidak** memanggil AI.
- (Opsional) `createJournalEntry`, `listJournalEntries`

Data kurasi (isolated di `src/lib/`, ditandai jelas sebagai data terkurasi hackathon):
- `knowledge-base.ts` — 15 entry: `{id, title, source, source_url, category, content, published_year}` — topik: autism, Down syndrome, cerebral palsy, ADHD, intellectual/sensory/physical/communication/developmental needs, deteksi dini, terapi wicara/okupasi/fisik, hak difabel Indonesia, KIS/PBI-JK/PKH.
- `facilities.ts` — 12 fasilitas (RS/klinik terapi/SLB) 5 kota, dengan `verification_note: "data terkurasi hackathon"`.
- `aid-programs.ts` — 6 program dengan syarat terstruktur untuk rule engine.
- `future-roles.ts` — komentar dokumentasi arsitektur role untuk slide.

## Routes (TanStack)
Public:
- `/` — landing: brand promise + 3 fitur inti + CTA masuk/daftar
- `/auth` — sign in/sign up (integration-managed jika tersedia)

Authenticated (`_authenticated/`):
- `/onboarding` — wizard 4 langkah membuat Person Profile pertama, redirect ke sini jika belum ada
- `/beranda` (dashboard)
- `/roadmap` — list target + timeline mingguan/bulanan/terapi (Tabs)
- `/asisten` — chat AI dengan sources + limitation note
- `/layanan` — Tabs: Fasilitas & Bantuan Pemerintah
- `/jurnal` (opsional)
- `/pengaturan` — kelola Person Profile, ganti profil aktif, sign out

Head metadata unik per route (title & description Bahasa Indonesia), `sitemap.xml` + `robots.txt` + `llms.txt` dengan hanya route publik.

## Chat UI
Pakai AI Elements (`bun x ai-elements@latest add conversation message prompt-input shimmer`): Conversation/Message/PromptInput/Shimmer. Assistant message tanpa background bubble, user message bubble pakai token brand-primary/text-inverse. Setiap jawaban AI tampilkan section "Sumber" + kalimat batas "Panduan umum, bukan diagnosis. Diskusikan dengan tenaga profesional."

## Urutan delivery
1. Enable Lovable Cloud + migrasi schema + RLS + GRANT + trigger profile
2. Design system tokens + font + Tailwind theme + shadcn variant selaras brand
3. Auth wiring + `/auth` + root nav shell + sign-out hygiene
4. Landing `/`
5. Person Profile onboarding wizard + gate
6. App shell (sidebar desktop + bottom nav mobile) + dashboard
7. Roadmap generator + halaman roadmap
8. Asisten AI + knowledge base retrieval
9. Layanan (fasilitas + rule-engine aid)
10. SEO metadata + sitemap/robots/llms
11. (Opsional) Jurnal

Journal dipotong pertama kalau waktu mepet.

Siap eksekusi?