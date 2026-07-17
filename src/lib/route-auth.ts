import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./authorization";

export async function requireRouteRole(role: AppRole) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw redirect({ to: "/auth" });
  const result = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()) as unknown as { data: { role?: AppRole } | null };
  if (result.data?.role !== role) throw redirect({ to: "/beranda" });
}
