import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateObject } from "ai";
import { z } from "zod";
import { createGroqProvider, DEFAULT_CHAT_MODEL } from "./ai-gateway.server";

const RoadmapSchema = z.object({
  weekly: z.array(z.object({ title: z.string(), description: z.string() })),
  monthly: z.array(z.object({ title: z.string(), description: z.string() })),
  therapy: z.array(z.object({ title: z.string(), description: z.string() })),
});

export const getActiveRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("person_profiles")
      .select("id")
      .eq("active", true)
      .maybeSingle();
    if (!profile) return null;
    const { data: roadmap } = await context.supabase
      .from("roadmaps")
      .select("*")
      .eq("person_profile_id", profile.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!roadmap) return { roadmap: null, items: [], person_profile_id: profile.id };
    const { data: items } = await context.supabase
      .from("roadmap_items")
      .select("*")
      .eq("roadmap_id", roadmap.id)
      .order("category", { ascending: true })
      .order("order_index", { ascending: true });
    return { roadmap, items: items ?? [], person_profile_id: profile.id };
  });

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Kunci AI belum tersedia. Coba lagi sebentar.");

    const { data: profile, error: pErr } = await context.supabase
      .from("person_profiles")
      .select("*")
      .eq("active", true)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Belum ada Person Profile aktif.");

    const gateway = createGroqProvider(apiKey);

    const prompt = [
      "Anda adalah pendamping keluarga (bukan dokter) yang membantu menyusun rencana dukungan awal.",
      "Gunakan Bahasa Indonesia yang hangat, jelas, tidak menghakimi. Hindari kalimat diagnosis.",
      "Buat rencana untuk profil berikut:",
      `- Nama: ${profile.display_name}`,
      profile.age != null ? `- Usia: ${profile.age} tahun` : "",
      `- Ringkasan dukungan: ${profile.support_summary || "(belum diisi)"}`,
      `- Kebutuhan dukungan: ${(profile.support_needs || []).join(", ") || "(belum diisi)"}`,
      "",
      "Berikan:",
      "- 3 langkah mingguan yang konkret dan kecil (weekly)",
      "- 3 target bulanan yang realistis (monthly)",
      "- 3 rekomendasi terapi awal untuk didiskusikan dengan tenaga profesional (therapy)",
      "Setiap item singkat: title (max 8 kata) dan description (1-2 kalimat, ajakan lembut).",
    ]
      .filter(Boolean)
      .join("\n");

    let plan: z.infer<typeof RoadmapSchema>;
    try {
      const result = await generateObject({
        model: gateway(DEFAULT_CHAT_MODEL),
        schema: RoadmapSchema,
        prompt,
      });
      plan = result.object;
    } catch (e) {
      console.error("[roadmap] AI error", e);
      throw new Error("Asisten AI sedang tidak dapat merespons. Coba lagi sebentar.");
    }

    const { data: roadmap, error: rErr } = await context.supabase
      .from("roadmaps")
      .insert({
        owner_id: context.userId,
        person_profile_id: profile.id,
        ai_model: DEFAULT_CHAT_MODEL,
      })
      .select()
      .single();
    if (rErr) throw new Error(rErr.message);

    const rows = [
      ...plan.weekly.map((it, i) => ({ category: "weekly" as const, ...it, order_index: i })),
      ...plan.monthly.map((it, i) => ({ category: "monthly" as const, ...it, order_index: i })),
      ...plan.therapy.map((it, i) => ({ category: "therapy" as const, ...it, order_index: i })),
    ].map((r) => ({
      owner_id: context.userId,
      roadmap_id: roadmap.id,
      category: r.category,
      title: r.title,
      description: r.description,
      order_index: r.order_index,
    }));

    const { error: iErr } = await context.supabase.from("roadmap_items").insert(rows);
    if (iErr) throw new Error(iErr.message);

    return { ok: true, roadmap_id: roadmap.id };
  });

export const toggleRoadmapItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "done"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("roadmap_items")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
