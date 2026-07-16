import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReactNode } from "react";

const { api } = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/lib/api", () => ({ api }));

import { ActivePersonProvider, useActivePerson } from "./active-person-context";

const people = [
  { id: "one", display_name: "Adit" },
  { id: "two", display_name: "Naya" },
];

function wrapper({ children }: { children: ReactNode }) {
  return <ActivePersonProvider>{children}</ActivePersonProvider>;
}

describe("ActivePersonProvider", () => {
  beforeEach(() => {
    api.mockReset();
    api.mockImplementation((path: string) => Promise.resolve(path === "/auth/me" ? { id: "user-1" } : people));
  });

  it("uses the first profile as fallback and persists selection per user", async () => {
    const { result } = renderHook(() => useActivePerson(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activePersonId).toBe("one");
    act(() => result.current.selectPerson("two"));
    expect(result.current.activePersonId).toBe("two");
    expect(localStorage.getItem("rangkul:active-person:user-1")).toBe("two");
  });

  it("ignores inaccessible stored IDs", async () => {
    localStorage.setItem("rangkul:active-person:user-1", "other-user-person");
    const { result } = renderHook(() => useActivePerson(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activePersonId).toBe("one");
  });
});
