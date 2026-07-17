"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearActivePersonSelections } from "@/features/people/active-person-context";

export function LogoutButton({ redirectTo = "/login" }: { redirectTo?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await api("/auth/logout", { method: "POST" });
      clearActivePersonSelections();
      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  }

  return <button type="button" className="secondary compact" disabled={loading} onClick={logout}>
    {loading ? "Keluar…" : "Keluar"}
  </button>;
}
