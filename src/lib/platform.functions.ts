/* eslint-disable @typescript-eslint/no-explicit-any -- additive migration types are intentionally consumed before remote type generation */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkpointAnalysisSchema } from "./multimodal/contracts";

const personInput = z.object({ personId: z.string().uuid() });

async function assertPersonAccess(db: any, userId: string, personId: string) {
  const { data: owned } = await db
    .from("person_profiles")
    .select("id")
    .eq("id", personId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (owned) return;
  const { data: access } = await db
    .from("person_access")
    .select("access_level")
    .eq("person_id", personId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!access) throw new Error("Forbidden: profil tidak terhubung dengan akun ini.");
}

export const getPlatformOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as any;
    const { data: person, error } = await db
      .from("person_profiles")
      .select("*")
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!person)
      return {
        person: null,
        tasks: [],
        journals: [],
        analyses: [],
        applications: [],
        recommendations: [],
        appointments: [],
      };
    await assertPersonAccess(db, context.userId, person.id);
    const [journals, analyses, applications, recommendations, appointments] = await Promise.all([
      db
        .from("journal_entries")
        .select("*")
        .eq("person_profile_id", person.id)
        .order("created_at", { ascending: false })
        .limit(5),
      db
        .from("journal_analyses")
        .select("*")
        .eq("person_id", person.id)
        .order("captured_at", { ascending: false })
        .limit(5),
      db
        .from("aid_applications")
        .select("*")
        .eq("person_id", person.id)
        .order("updated_at", { ascending: false })
        .limit(3),
      db
        .from("professional_recommendations")
        .select("*")
        .eq("person_id", person.id)
        .eq("status", "active")
        .limit(3),
      db
        .from("appointments")
        .select("*")
        .eq("person_id", person.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(3),
    ]);
    const { data: roadmaps } = await db
      .from("roadmaps")
      .select("id")
      .eq("person_profile_id", person.id)
      .eq("status", "active")
      .limit(1);
    let tasks: any[] = [];
    if (roadmaps?.[0]) {
      const { data: goals } = await db
        .from("roadmap_goals")
        .select("id")
        .eq("roadmap_id", roadmaps[0].id);
      if (goals?.length) {
        const result = await db
          .from("roadmap_tasks")
          .select("*")
          .in(
            "goal_id",
            goals.map((goal: any) => goal.id),
          )
          .is("completed_at", null)
          .limit(5);
        tasks = result.data ?? [];
      }
    }
    return {
      person,
      tasks,
      journals: journals.data ?? [],
      analyses: analyses.data ?? [],
      applications: applications.data ?? [],
      recommendations: recommendations.data ?? [],
      appointments: appointments.data ?? [],
    };
  });

export const listCatalogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as any;
    const [facilities, programs] = await Promise.all([
      db.from("facilities").select("*").eq("active", true).order("name"),
      db.from("aid_programs").select("*").eq("active", true).order("name"),
    ]);
    if (facilities.error) throw new Error(facilities.error.message);
    if (programs.error) throw new Error(programs.error.message);
    return { facilities: facilities.data ?? [], programs: programs.data ?? [] };
  });

export const saveFacility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ facilityId: z.string().uuid(), saved: z.boolean() }))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const query = data.saved
      ? db
          .from("saved_facilities")
          .upsert({ user_id: context.userId, facility_id: data.facilityId })
      : db
          .from("saved_facilities")
          .delete()
          .eq("user_id", context.userId)
          .eq("facility_id", data.facilityId);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createCheckpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      personId: z.string().uuid(),
      modality: z.enum(["voice", "face_behavior", "movement_video"]),
      taskCode: z.string().min(1).max(80),
      note: z.string().max(2000).default(""),
      analysis: checkpointAnalysisSchema.omit({ id: true, journalEntryId: true, personId: true }),
      retainRawMedia: z.boolean().default(false),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    await assertPersonAccess(db, context.userId, data.personId);
    const { data: consent } = await db
      .from("consent_settings")
      .select("media_analysis_consent,raw_media_retention")
      .eq("person_id", data.personId)
      .maybeSingle();
    if (!consent?.media_analysis_consent)
      throw new Error("Persetujuan analisis media belum diberikan.");
    const { data: entry, error: entryError } = await db
      .from("journal_entries")
      .insert({
        owner_id: context.userId,
        person_profile_id: data.personId,
        content: data.note || `Checkpoint ${data.taskCode}`,
        mood_tag: "checkpoint",
        modality: data.modality,
      })
      .select("id")
      .single();
    if (entryError) throw new Error(entryError.message);
    const { data: analysis, error } = await db
      .from("journal_analyses")
      .insert({
        journal_entry_id: entry.id,
        person_id: data.personId,
        recommendation_id: data.analysis.recommendationId,
        modality: data.modality,
        task_code: data.taskCode,
        captured_at: data.analysis.capturedAt,
        quality: data.analysis.quality,
        metrics: data.analysis.metrics,
        feature_vector: data.analysis.featureVector,
        event_segments: data.analysis.eventSegments ?? [],
        model_info: data.analysis.modelInfo,
        automated_trend: data.analysis.automatedTrend,
        ai_summary: data.analysis.aiSummary ?? null,
        raw_media_delete_after:
          data.retainRawMedia && consent.raw_media_retention
            ? null
            : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return analysis;
  });

export const updateConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    personInput.extend({
      mediaAnalysisConsent: z.boolean(),
      professionalSharing: z.boolean(),
      rawMediaRetention: z.boolean(),
      personalizedAiContext: z.boolean(),
      journalVisibility: z.enum(["private", "family_only", "shared_professionals"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    await assertPersonAccess(db, context.userId, data.personId);
    const { error } = await db.from("consent_settings").upsert({
      person_id: data.personId,
      journal_visibility: data.journalVisibility,
      media_analysis_consent: data.mediaAnalysisConsent,
      professional_sharing: data.professionalSharing,
      raw_media_retention: data.rawMediaRetention,
      personalized_ai_context: data.personalizedAiContext,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createProfessionalReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      analysisId: z.string().uuid(),
      decision: z.enum(["acknowledged", "recommendation_created", "recapture_requested"]),
      notes: z.string().min(3).max(2000),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", context.userId)
      .single();
    if (profile?.role !== "professional")
      throw new Error("Forbidden: hanya profesional yang dapat meninjau checkpoint.");
    const { error } = await db.from("professional_reviews").upsert(
      {
        analysis_id: data.analysisId,
        professional_id: context.userId,
        decision: data.decision,
        notes: data.notes,
      },
      { onConflict: "analysis_id,professional_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
