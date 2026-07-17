import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { personProfileInputSchema, setActiveProfileInputSchema } from "./validation";
import { enforceRateLimit } from "./rate-limit.server";
import { PublicError } from "./public-error";

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
  .inputValidator((input: unknown) => personProfileInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, "profile");
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
    if (error) {
      console.error("[person-profile:create]", error);
      throw new PublicError("Profil tidak dapat disimpan. Silakan coba lagi.");
    }
    return row;
  });

export const setActivePersonProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setActiveProfileInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, "profile");
    await context.supabase.from("person_profiles").update({ active: false }).eq("owner_id", context.userId);
    const { error } = await context.supabase
      .from("person_profiles")
      .update({ active: true })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) {
      console.error("[person-profile:activate]", error);
      throw new PublicError("Profil aktif tidak dapat diperbarui.");
    }
    return { ok: true };
  });
