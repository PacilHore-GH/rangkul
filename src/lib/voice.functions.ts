import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { structuredCheckpointSummarySchema } from "./multimodal/contracts";
import { voiceMetrics } from "./multimodal/analysis";

const inputSchema = z.object({
  base64: z.string().min(20).max(14_000_000),
  mimeType: z.enum(["audio/webm", "audio/mpeg", "audio/mp4", "audio/wav"]),
  durationSeconds: z.number().min(1).max(180),
  expectedPhrase: z.string().max(200).optional(),
});

async function createSummary(apiKey: string, payload: unknown) {
  const request = async () => {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_REPORT_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Return only JSON for a non-diagnostic checkpoint observation. Never prescribe, diagnose, infer identity, or claim causality.",
          },
          {
            role: "user",
            content: `Return headline, observationSummary, positiveObservations, professionalReviewItems, comparisonWithPrevious, dataQualitySummary, limitations, suggestedQuestions, trend. Input: ${JSON.stringify(payload)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Groq rate limit tercapai."
          : `Groq report gagal (${response.status}).`,
      );
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return structuredCheckpointSummarySchema.parse(
      JSON.parse(json.choices?.[0]?.message?.content ?? "{}"),
    );
  };
  try {
    return await request();
  } catch {
    return request();
  }
}

export const transcribeVoiceCheckpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(inputSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      throw new Error("GROQ_API_KEY belum dikonfigurasi. Entri dasar tetap dapat disimpan.");
    const binary = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0));
    if (binary.byteLength > 10_000_000) throw new Error("Audio melebihi batas 10 MB.");
    const form = new FormData();
    form.append(
      "file",
      new Blob([binary], { type: data.mimeType }),
      `checkpoint.${data.mimeType.split("/")[1]}`,
    );
    form.append("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo");
    form.append("response_format", "verbose_json");
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Batas layanan transkripsi tercapai."
          : `Transkripsi gagal (${response.status}).`,
      );
    const transcript = (await response.json()) as {
      text?: string;
      segments?: Array<{ start: number; end: number; text: string }>;
    };
    if (!transcript.text?.trim()) throw new Error("Audio hening atau ucapan tidak dapat dikenali.");
    const metrics = voiceMetrics({
      transcript: transcript.text,
      durationSeconds: data.durationSeconds,
      expectedPhrase: data.expectedPhrase,
    });
    const summary = await createSummary(apiKey, {
      task: "expected_phrase",
      metrics,
      quality: metrics.qualityScore,
      trend: "insufficient_data",
      limitations: ["Bukan diagnosis; tanpa identifikasi pembicara."],
    });
    return {
      transcript: transcript.text,
      segments: transcript.segments ?? [],
      metrics,
      summary,
      model: process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo",
    };
  });
