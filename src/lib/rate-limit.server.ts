import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PublicError } from "./public-error";

export type RateLimitAction = "chat" | "roadmap" | "journal" | "profile" | "aid";

export async function enforceRateLimit(
  supabase: SupabaseClient<Database>,
  action: RateLimitAction,
): Promise<void> {
  const { data, error } = await supabase.rpc("consume_app_rate_limit", { p_action: action });
  if (error) {
    console.error("[rate-limit]", error);
    throw new PublicError("Layanan keamanan sementara tidak tersedia. Coba lagi.", 503);
  }
  if (!data) throw new PublicError("Terlalu banyak permintaan. Silakan coba lagi nanti.", 429);
}
