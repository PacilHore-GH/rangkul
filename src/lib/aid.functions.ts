import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { matchAid } from "./aid-rule-engine";
import { aidInputSchema } from "./validation";
import { enforceRateLimit } from "./rate-limit.server";

export const matchAidForActiveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => aidInputSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, "aid");
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
