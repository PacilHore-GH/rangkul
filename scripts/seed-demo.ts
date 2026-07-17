/* eslint-disable @typescript-eslint/no-explicit-any -- seed runs against additive tables before generated Supabase types are refreshed */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.RANGKUL_DEMO_PASSWORD;
if (!url || !key || !password || password.length < 12) {
  throw new Error(
    "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and a 12+ character RANGKUL_DEMO_PASSWORD. Values are never committed.",
  );
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const users = [
  {
    email: process.env.RANGKUL_DEMO_FAMILY_EMAIL ?? "family.demo@example.invalid",
    role: "family_member_caregiver",
  },
  {
    email: process.env.RANGKUL_DEMO_PROFESSIONAL_EMAIL ?? "professional.demo@example.invalid",
    role: "professional",
  },
  { email: process.env.RANGKUL_DEMO_ADMIN_EMAIL ?? "admin.demo@example.invalid", role: "admin" },
] as const;
async function ensureUser(email: string, role: string) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = listed.data.users.find((candidate) => candidate.email === email);
  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `Demo ${role}`, role },
    });
    if (created.error) throw created.error;
    user = created.data.user;
  }
  await (admin as any).from("profiles").upsert({ id: user.id, display_name: `Demo ${role}`, role });
  return user.id;
}
const [familyId, professionalId, adminId] = await Promise.all(
  users.map((user) => ensureUser(user.email, user.role)),
);
const personId = "40000000-0000-4000-8000-000000000001";
await (admin as any).from("person_profiles").upsert({
  id: personId,
  owner_id: familyId,
  display_name: "Alya (Profil Demo)",
  age: 10,
  support_summary: "Profil sintetis untuk review alur Rangkul.",
  support_needs: ["communication", "sensory", "daily_living"],
  active: true,
});
await (admin as any).from("person_access").upsert(
  [
    {
      person_id: personId,
      user_id: familyId,
      access_level: "owner",
      journal_shared: true,
      granted_by: familyId,
    },
    {
      person_id: personId,
      user_id: professionalId,
      access_level: "professional",
      journal_shared: true,
      granted_by: familyId,
    },
  ],
  { onConflict: "person_id,user_id" },
);
await (admin as any).from("consent_settings").upsert({
  person_id: personId,
  journal_visibility: "shared_professionals",
  media_analysis_consent: true,
  professional_sharing: true,
  raw_media_retention: false,
  personalized_ai_context: true,
  updated_by: familyId,
});
const roadmapId = "41000000-0000-4000-8000-000000000001";
await (admin as any).from("roadmaps").upsert({
  id: roadmapId,
  owner_id: familyId,
  person_profile_id: personId,
  title: "Roadmap komunikasi dan kemandirian",
  status: "active",
  review_date: "2026-08-17",
});
const goals = [
  ["42000000-0000-4000-8000-000000000001", "Mengikuti instruksi satu langkah"],
  ["42000000-0000-4000-8000-000000000002", "Melatih gerakan tangan bilateral"],
  ["42000000-0000-4000-8000-000000000003", "Menyiapkan rutinitas pagi"],
];
await (admin as any).from("roadmap_goals").upsert(
  goals.map(([id, title]) => ({
    id,
    roadmap_id: roadmapId,
    title,
    status: "active",
    review_date: "2026-08-17",
  })),
);
await (admin as any).from("roadmap_tasks").upsert(
  Array.from({ length: 5 }, (_, i) => ({
    id: `43000000-0000-4000-8000-00000000000${i + 1}`,
    goal_id: goals[i % 3][0],
    title: [
      "Latihan instruksi 5 menit",
      "Angkat tangan bersama",
      "Gunakan jadwal visual",
      "Catat respons",
      "Istirahat sensori",
    ][i],
    weekday: i + 1,
  })),
);
const recommendationId = "44000000-0000-4000-8000-000000000001";
await (admin as any).from("professional_recommendations").upsert({
  id: recommendationId,
  person_id: personId,
  professional_id: professionalId,
  title: "Latihan angkat kedua tangan",
  guidance: "Lakukan dalam rentang nyaman dan berhenti bila tidak nyaman.",
  task_code: "bilateral_arm_raise",
  target_metric: "normalized_similarity",
  review_date: "2026-08-17",
  status: "active",
});
await (admin as any).from("journal_entries").upsert([
  {
    id: "45000000-0000-4000-8000-000000000001",
    owner_id: familyId,
    person_profile_id: personId,
    title: "Rutinitas pagi",
    content: "Mengikuti dua langkah dengan jeda.",
    mood_tag: "tenang",
    modality: "text",
  },
  {
    id: "45000000-0000-4000-8000-000000000002",
    owner_id: familyId,
    person_profile_id: personId,
    title: "Persiapan konsultasi",
    content: "Mencatat tiga pertanyaan untuk profesional.",
    mood_tag: "fokus",
    modality: "text",
  },
  {
    id: "45000000-0000-4000-8000-000000000003",
    owner_id: familyId,
    person_profile_id: personId,
    title: "Merapikan meja",
    content: "Milestone demo tanpa media pribadi.",
    mood_tag: "bangga",
    modality: "milestone",
  },
  {
    id: "45000000-0000-4000-8000-000000000004",
    owner_id: familyId,
    person_profile_id: personId,
    title: "Menyiapkan tas",
    content: "Milestone demo kedua.",
    mood_tag: "senang",
    modality: "milestone",
  },
  {
    id: "45000000-0000-4000-8000-000000000005",
    owner_id: familyId,
    person_profile_id: personId,
    title: "Suara demo",
    content: "Analisis sintetis.",
    mood_tag: "checkpoint",
    modality: "voice",
  },
  {
    id: "45000000-0000-4000-8000-000000000006",
    owner_id: familyId,
    person_profile_id: personId,
    title: "Wajah demo",
    content: "Analisis perilaku wajah sintetis.",
    mood_tag: "checkpoint",
    modality: "face_behavior",
  },
  {
    id: "45000000-0000-4000-8000-000000000007",
    owner_id: familyId,
    person_profile_id: personId,
    title: "Gerakan demo",
    content: "Analisis gerak sintetis.",
    mood_tag: "checkpoint",
    modality: "movement_video",
  },
]);
for (const [index, modality] of ["voice", "face_behavior", "movement_video"].entries())
  await (admin as any).from("journal_analyses").upsert({
    id: `46000000-0000-4000-8000-00000000000${index + 1}`,
    journal_entry_id: `45000000-0000-4000-8000-00000000000${index + 5}`,
    person_id: personId,
    recommendation_id: index === 2 ? recommendationId : null,
    modality,
    task_code: index === 2 ? "bilateral_arm_raise" : "demo_observation",
    quality: { status: "valid", score: 0.82, issues: [] },
    metrics: { synthetic: true, validFrameRatio: 0.86 },
    feature_vector: [0.2, 0.6, 0.82],
    event_segments: [],
    model_info: { fixture: "synthetic-demo", version: "1.0" },
    automated_trend: "insufficient_data",
  });
await (admin as any).from("aid_assessments").upsert({
  id: "47000000-0000-4000-8000-000000000001",
  owner_id: familyId,
  person_id: personId,
  answers: { age: 10, dtks: true },
  rules_version: "2026.1",
});
await (admin as any).from("aid_applications").upsert({
  id: "48000000-0000-4000-8000-000000000001",
  owner_id: familyId,
  person_id: personId,
  program_id: "20000000-0000-4000-8000-000000000001",
  status: "preparing",
  next_step: "Siapkan dokumen identitas dan cek DTKS.",
});
console.log(
  `Seed complete: family=${familyId}, professional=${professionalId}, admin=${adminId}, person=${personId}`,
);
