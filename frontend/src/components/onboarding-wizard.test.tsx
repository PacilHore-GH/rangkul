import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { api } = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api", () => ({
  api,
  createIdempotencyKey: () => "11111111-1111-4111-8111-111111111111",
  ApiError: class ApiError extends Error {},
}));

import { OnboardingWizard } from "./onboarding-wizard";

describe("OnboardingWizard", () => {
  beforeEach(() => {
    api.mockReset();
    api.mockResolvedValue({});
  });

  it("blocks invalid basic data and preserves valid input across steps", () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Masukkan nama panggilan");

    fireEvent.change(screen.getByLabelText("Nama panggilan"), { target: { value: "Adit" } });
    fireEvent.change(screen.getByLabelText("Hubungan Anda"), { target: { value: "parent" } });
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByText("Kebutuhan dukungan")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Komunikasi"));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByText("Preferensi komunikasi dan aksesibilitas")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Dukungan visual"));
    fireEvent.click(screen.getByLabelText("Lingkungan lebih tenang"));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByText("Adit")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Selesaikan profil" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Centang pernyataan kewenangan");
  });

  it("sanitizes profile fields before sending them to the API", async () => {
    render(<OnboardingWizard />);
    fireEvent.change(screen.getByLabelText("Nama panggilan"), { target: { value: " <b>Adit</b>\u0000 " } });
    fireEvent.change(screen.getByLabelText(/Tahun lahir/), { target: { value: "20ab20" } });
    fireEvent.change(screen.getByLabelText("Hubungan Anda"), { target: { value: "parent" } });
    expect(screen.getByLabelText(/Tahun lahir/)).toHaveValue("2020");
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    fireEvent.click(screen.getByLabelText("Komunikasi"));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    fireEvent.click(screen.getByLabelText("Dukungan visual"));
    fireEvent.click(screen.getByLabelText("Lingkungan lebih tenang"));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    fireEvent.change(screen.getByPlaceholderText(/lebih nyaman/), {
      target: { value: "Catatan <b>aman</b><script>alert(1)</script>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    fireEvent.click(screen.getByLabelText(/Saya berwenang/));
    await waitFor(() => expect(sessionStorage.getItem("rangkul:onboarding-draft")).not.toContain("consent"));
    fireEvent.click(screen.getByRole("button", { name: "Selesaikan profil" }));

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
    expect(api.mock.calls[0][0]).toBe("/people/onboarding");
    const request = api.mock.calls[0][1];
    expect(JSON.parse(request.body)).toMatchObject({
      display_name: "Adit",
      birth_year: 2020,
      communication_preferences: ["visual_support"],
      accessibility_preferences: ["reduced_noise"],
      primary_language: "id",
      notes: "Catatan aman",
      caregiver_relationship: "parent",
    });
    expect(request.headers["Idempotency-Key"]).toEqual(expect.any(String));
    expect(sessionStorage.getItem("rangkul:onboarding-draft")).toBeNull();
  });
});
