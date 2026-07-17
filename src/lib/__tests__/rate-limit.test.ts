import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "../rate-limit.server";

function clientReturning(data: boolean | null, error: unknown = null): SupabaseClient<Database> {
  return { rpc: vi.fn().mockResolvedValue({ data, error }) } as unknown as SupabaseClient<Database>;
}

describe("enforceRateLimit", () => {
  it("allows a request accepted by the database", async () => {
    const client = clientReturning(true);
    await expect(enforceRateLimit(client, "chat")).resolves.toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith("consume_app_rate_limit", { p_action: "chat" });
  });

  it("returns a public 429 when the limit is exhausted", async () => {
    await expect(enforceRateLimit(clientReturning(false), "chat")).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it("fails closed if the limiter cannot be reached", async () => {
    await expect(enforceRateLimit(clientReturning(null, { message: "db down" }), "chat")).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});
