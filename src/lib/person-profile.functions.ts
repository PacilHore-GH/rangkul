import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateInput = z.object({
  display_name: z.string().min(1).max(80),
  age: z.number().int().min(0).max(120).nullable().optional(),
  support_summary: z.string().max(1000).optional().default(""),
  support_needs: z.array(z.string().min(1).max(60)).max(20).optional().default([]),
  emergency_contact_name: z.string().max(120).optional().default(""),
  emergency_contact_phone: z.string().max(40).optional().default(""),
});

export const listPersonProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("person_profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getActivePersonProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("person_profiles")
      .select("*")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const createPersonProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }) => {
    // Deactivate previous profiles first so only one is active.
    await context.supabase.from("person_profiles").update({ active: false }).eq("owner_id", context.userId);
    const { data: row, error } = await context.supabase
      .from("person_profiles")
      .insert({
        owner_id: context.userId,
        display_name: data.display_name,
        age: data.age ?? null,
        support_summary: data.support_summary ?? "",
        support_needs: data.support_needs ?? [],
        emergency_contact_name: data.emergency_contact_name ?? "",
        emergency_contact_phone: data.emergency_contact_phone ?? "",
        active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setActivePersonProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.from("person_profiles").update({ active: false }).eq("owner_id", context.userId);
    const { error } = await context.supabase
      .from("person_profiles")
      .update({ active: true })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
