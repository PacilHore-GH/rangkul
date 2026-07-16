import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api", () => ({ api: vi.fn(), ApiError: class ApiError extends Error {} }));

import { OnboardingWizard } from "./onboarding-wizard";

describe("OnboardingWizard", () => {
  it("blocks invalid basic data and preserves valid input across steps", () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Isi nama panggilan");

    fireEvent.change(screen.getByLabelText("Nama panggilan"), { target: { value: "Adit" } });
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByText("Kebutuhan dukungan")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Komunikasi"));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(screen.getByText("Adit")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Selesaikan profil" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Persetujuan wajib");
  });
});
