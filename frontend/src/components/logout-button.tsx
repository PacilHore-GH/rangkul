"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await api("/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  return <button type="button" className="secondary compact" disabled={loading} onClick={logout}>
    {loading ? "Keluar…" : "Keluar"}
  </button>;
}
