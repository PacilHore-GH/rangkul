import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, push } = vi.hoisted(() => ({ api: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push }) }));
vi.mock("@/lib/api", () => ({ api }));

import { LogoutButton } from "./logout-button";

describe("LogoutButton", () => {
  beforeEach(() => {
    api.mockReset();
    push.mockReset();
  });

  it("revokes the authenticated session and returns to login", async () => {
    api.mockResolvedValue(undefined);
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));

    await waitFor(() => expect(api).toHaveBeenCalledWith("/auth/logout", { method: "POST" }));
    expect(push).toHaveBeenCalledWith("/login");
  });
});
