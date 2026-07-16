"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, CurrentUser } from "@/lib/api";

export function AppGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    api<CurrentUser>("/auth/me")
      .then((user) => {
        if (user.role !== "family") router.replace("/admin");
        else if (!user.onboarding_completed) router.replace("/app/onboarding");
        else setAllowed(true);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status !== 401) return;
        router.replace("/login");
      });
  }, [router]);

  if (!allowed) return <main className="app-shell"><p>Memeriksa sesi Anda…</p></main>;
  return children;
}
