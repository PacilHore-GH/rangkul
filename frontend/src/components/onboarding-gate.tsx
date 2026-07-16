"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, CurrentUser } from "@/lib/api";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export function OnboardingGate() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    api<CurrentUser>("/auth/me")
      .then((user) => {
        if (user.onboarding_completed) router.replace("/app/dashboard");
        else setAllowed(true);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status !== 401) return;
        router.replace("/login");
      });
  }, [router]);

  if (!allowed) return <main className="wizard-shell"><p>Memeriksa akun Anda…</p></main>;
  return <OnboardingWizard />;
}
