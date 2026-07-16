import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, push } = vi.hoisted(() => ({ api: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push }) }));
vi.mock("@/lib/api", () => ({
  api,
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  },
}));
vi.mock("./onboarding-wizard", () => ({ OnboardingWizard: () => <div>Wizard onboarding</div> }));

import { OnboardingGate } from "./onboarding-gate";

describe("OnboardingGate", () => {
  beforeEach(() => {
    api.mockReset();
    push.mockReset();
  });

  it("renders onboarding only for an authenticated user who has not completed it", async () => {
    api.mockResolvedValue({ onboarding_completed: false });
    render(<OnboardingGate />);
    expect(await screen.findByText("Wizard onboarding")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects an unauthenticated visitor to login", async () => {
    api.mockRejectedValue(new (class extends Error { status = 401; })());
    render(<OnboardingGate />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("redirects a user who completed onboarding to the dashboard", async () => {
    api.mockResolvedValue({ onboarding_completed: true });
    render(<OnboardingGate />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/dashboard"));
  });
});
