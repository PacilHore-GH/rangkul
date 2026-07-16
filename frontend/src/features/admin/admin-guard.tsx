"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, CurrentUser } from "@/lib/api";

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    api<CurrentUser>("/auth/me")
      .then((user) => user.role === "admin" ? setAllowed(true) : router.replace("/admin/login"))
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  return allowed ? children : <main className="app-shell"><p>Memeriksa akses Admin…</p></main>;
}
