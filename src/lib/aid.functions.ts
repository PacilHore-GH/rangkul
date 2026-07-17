import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { matchAid } from "./aid-rule-engine";

export const matchAidForActiveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ dtks_or_low_income: z.boolean().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase
      .from("person_profiles")
      .select("id, age, support_needs")
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return { matches: [], profile: null };

    const has_disability_flag = (profile.support_needs ?? []).some((s: string) =>
      /disabilitas|difabel|autis|down|cerebral|adhd|intelektual|tuli|buta/i.test(s),
    );

    const matches = matchAid({
      age: profile.age,
      has_disability_flag,
      dtks_or_low_income: data.dtks_or_low_income,
    });
    return { matches, profile };
  });
