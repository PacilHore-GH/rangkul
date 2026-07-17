import { describe, expect, it } from "vitest";
import { z } from "zod";
import { PublicError, publicErrorResponse, toPublicMessage } from "../public-error";

describe("public errors", () => {
  it("does not expose unexpected internal errors", () => {
    expect(toPublicMessage(new Error("relation app_users does not exist"))).toBe(
      "Terjadi kendala sementara. Silakan coba lagi.",
    );
  });

  it("preserves deliberate and validation messages", async () => {
    expect(toPublicMessage(new PublicError("Coba lagi."))).toBe("Coba lagi.");
    const result = z.string().min(3, "Minimal tiga karakter.").safeParse("x");
    if (result.success) throw new Error("expected invalid input");
    expect(toPublicMessage(result.error)).toBe("Minimal tiga karakter.");

    const response = publicErrorResponse(new PublicError("Terlalu cepat.", 429));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Terlalu cepat." });
  });
});
