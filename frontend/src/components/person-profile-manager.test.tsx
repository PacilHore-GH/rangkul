import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, push } = vi.hoisted(() => ({ api: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push, refresh: vi.fn() }) }));
vi.mock("@/lib/api", () => ({
  api,
  createIdempotencyKey: () => "11111111-1111-4111-8111-111111111111",
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  },
}));

import { PersonProfileManager } from "./person-profile-manager";

const person = {
  id: "person-1",
  display_name: "Adit",
  birth_year: 2020,
  support_needs: ["communication"],
  communication_preferences: ["visual_support"],
  accessibility_preferences: ["reduced_noise"],
  primary_language: "id",
  notes: "Suka rutinitas.",
  caregiver_relationship: "parent",
  completeness: {
    percentage: 100,
    sections: [
      { code: "basic", completed: true },
      { code: "support_needs", completed: true },
      { code: "preferences", completed: true },
      { code: "notes", completed: true },
    ],
  },
};

describe("PersonProfileManager", () => {
  beforeEach(() => {
    api.mockReset();
    push.mockReset();
  });

  it("updates the owner's Person Profile", async () => {
    api.mockResolvedValueOnce([person]).mockResolvedValueOnce({ ...person, display_name: "Adit Pratama" });
    render(<PersonProfileManager />);
    expect(await screen.findByText("Adit")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit profil" }));
    fireEvent.change(screen.getByLabelText("Nama panggilan"), { target: { value: "Adit Pratama" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    await waitFor(() => expect(api).toHaveBeenLastCalledWith("/people/person-1", expect.objectContaining({
      method: "PATCH",
    })));
  });

  it("deletes only the selected profile without reopening onboarding", async () => {
    api.mockResolvedValueOnce([person]).mockResolvedValueOnce(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<PersonProfileManager />);
    await screen.findByText("Adit");
    fireEvent.click(screen.getByRole("button", { name: "Hapus profil" }));

    await waitFor(() => expect(api).toHaveBeenLastCalledWith("/people/person-1", { method: "DELETE" }));
    expect(push).not.toHaveBeenCalledWith("/app/onboarding");
    await waitFor(() => expect(screen.queryByText("Adit")).not.toBeInTheDocument());
  });

  it("creates another profile even when an existing person is already listed", async () => {
    api.mockResolvedValueOnce([person]).mockResolvedValueOnce({
      ...person,
      id: "person-2",
      display_name: "Naya",
    });
    render(<PersonProfileManager />);
    expect(await screen.findByText("Adit")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tambah orang yang didampingi" }));
    fireEvent.change(screen.getByLabelText("Nama panggilan"), { target: { value: "Naya" } });
    fireEvent.change(screen.getByLabelText("Hubungan Anda"), { target: { value: "guardian" } });
    fireEvent.click(screen.getByLabelText("Komunikasi"));
    fireEvent.click(screen.getByLabelText(/Saya berwenang/));
    fireEvent.click(screen.getByRole("button", { name: "Simpan profil" }));

    await waitFor(() => expect(api).toHaveBeenLastCalledWith("/people", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
    })));
  });
});
