import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("person_profiles")
      .select("id")
      .eq("active", true)
      .maybeSingle();
    if (!profile) return [];
    const { data, error } = await context.supabase
      .from("journal_entries")
      .select("*")
      .eq("person_profile_id", profile.id)
      .order("entry_date", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        content: z.string().min(1).max(2000),
        mood_tag: z.string().min(1).max(30),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("person_profiles")
      .select("id")
      .eq("active", true)
      .maybeSingle();
    if (!profile) throw new Error("Belum ada Person Profile aktif.");
    const { data: row, error } = await context.supabase
      .from("journal_entries")
      .insert({
        owner_id: context.userId,
        person_profile_id: profile.id,
        content: data.content,
        mood_tag: data.mood_tag,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
