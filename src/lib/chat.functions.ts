import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createGroqProvider, DEFAULT_CHAT_MODEL } from "./ai-gateway.server";
import { retrieveKnowledge } from "./knowledge-base";

export const listChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const SYSTEM_PROMPT = `Anda adalah Asisten Rangkul: pendamping keluarga untuk orang dengan kebutuhan dukungan khusus di Indonesia.

Aturan mutlak:
- Bukan dokter, psikolog, atau terapis. Tidak memberi diagnosis, resep, atau keputusan medis.
- Gunakan Bahasa Indonesia yang hangat, hormat, singkat, tidak menghakimi.
- Selalu rujuk pada sumber yang disediakan; jangan mengarang fakta atau sumber.
- Selalu tutup dengan ajakan lembut untuk berdiskusi dengan tenaga profesional bila relevan.
- Gunakan frasa: "dapat dipertimbangkan", "berdasarkan informasi yang tersedia", "hasil ini bersifat awal".
- Jika pertanyaan di luar konteks dukungan keluarga/kebutuhan khusus, arahkan kembali dengan sopan.`;

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ text: z.string().trim().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Kunci AI belum tersedia. Coba lagi sebentar.");

    // Save user message first.
    await context.supabase.from("chat_messages").insert({
      owner_id: context.userId,
      role: "user",
      content: data.text,
    });

    const sources = retrieveKnowledge(data.text, 3);
    const context_block = sources
      .map((s, i) => `[${i + 1}] ${s.title} — ${s.source}\n${s.content}`)
      .join("\n\n");

    // Load recent history (last 10) for continuity.
    const { data: history } = await context.supabase
      .from("chat_messages")
      .select("role, content")
      .order("created_at", { ascending: false })
      .limit(10);
    const recent = (history ?? []).reverse();

    const gateway = createGroqProvider(apiKey);
    let text: string;
    try {
      const result = await generateText({
        model: gateway(process.env.GROQ_REPORT_MODEL || DEFAULT_CHAT_MODEL),
        system: SYSTEM_PROMPT,
        messages: [
          ...recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          {
            role: "user" as const,
            content: `Pertanyaan pengguna:\n${data.text}\n\nGunakan konteks berikut sebagai rujukan dan sebutkan nomor rujukan [1]/[2]/[3] bila relevan:\n\n${context_block}\n\nAkhiri jawaban dengan kalimat "Panduan umum, bukan diagnosis. Diskusikan dengan tenaga profesional bila memungkinkan."`,
          },
        ],
      });
      text = result.text;
    } catch (e) {
      console.error("[chat] AI error", e);
      // Save a friendly fallback so the transcript stays meaningful.
      const fallback =
        "Asisten sedang tidak dapat merespons. Catatan Anda tetap aman dan dapat dicoba kembali.";
      await context.supabase.from("chat_messages").insert({
        owner_id: context.userId,
        role: "assistant",
        content: fallback,
        sources: [],
      });
      throw new Error(fallback);
    }

    const savedSources = sources.map((s) => ({
      id: s.id,
      title: s.title,
      source: s.source,
      source_url: s.source_url,
    }));

    await context.supabase.from("chat_messages").insert({
      owner_id: context.userId,
      role: "assistant",
      content: text,
      sources: savedSources,
    });

    return { content: text, sources: savedSources };
  });
