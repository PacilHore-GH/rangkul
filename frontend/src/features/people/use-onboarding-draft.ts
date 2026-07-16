"use client";

import { useEffect, useState } from "react";
import {
  DraftStorage,
  OnboardingDraftData,
  parseDraft,
  sessionDraftStorage,
} from "./onboarding-draft";

export const emptyOnboardingDraft: OnboardingDraftData = {
  displayName: "",
  birthYear: "",
  relationship: "",
  supportNeeds: [],
  communication: [],
  accessibility: [],
  primaryLanguage: "id",
  notes: "",
};

export function useOnboardingDraft(storage: DraftStorage = sessionDraftStorage) {
  const initial = typeof window === "undefined" ? null : parseDraft(storage.read());
  const [step, setStep] = useState(initial?.step ?? 1);
  const [data, setData] = useState<OnboardingDraftData>(initial?.data ?? emptyOnboardingDraft);
  const [restored, setRestored] = useState(Boolean(initial));

  useEffect(() => {
    storage.write(JSON.stringify({ version: 1, step, data }));
  }, [data, step, storage]);

  function reset() {
    storage.clear();
    setStep(1);
    setData(emptyOnboardingDraft);
    setRestored(false);
  }

  return { step, setStep, data, setData, restored, setRestored, clear: storage.clear, reset };
}
