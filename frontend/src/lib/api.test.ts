import { afterEach, describe, expect, it, vi } from "vitest";

import { api, ApiError } from "./api";

describe("API error messages", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("translates FastAPI email validation into a natural message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: [{
        type: "value_error",
        loc: ["body", "email"],
        msg: "value is not a valid email address",
      }],
    }), { status: 422, headers: { "Content-Type": "application/json" } })));

    await expect(api("/auth/login")).rejects.toMatchObject<ApiError>({
      status: 422,
      message: "Masukkan alamat email yang valid, misalnya nama@mail.com.",
    });
  });

  it("uses a calm service message for server failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(api("/auth/login")).rejects.toMatchObject<ApiError>({
      status: 503,
      message: "Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat.",
    });
  });

  it("always includes the HttpOnly session cookie in cross-origin API requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await api("/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("preserves JSON content type when a mutation adds an idempotency header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await api("/people", {
      method: "POST",
      headers: { "Idempotency-Key": "11111111-1111-4111-8111-111111111111" },
      body: JSON.stringify({ display_name: "Adit" }),
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/people", expect.objectContaining({
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "11111111-1111-4111-8111-111111111111",
      },
    }));
  });
});
