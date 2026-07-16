export type OnboardingDraftData = {
  displayName: string;
  birthYear: string;
  relationship: string;
  supportNeeds: string[];
  communication: string[];
  accessibility: string[];
  primaryLanguage: string;
  notes: string;
};

export type OnboardingDraft = {
  version: 1;
  step: number;
  data: OnboardingDraftData;
};

export interface DraftStorage {
  read(): string | null;
  write(value: string): void;
  clear(): void;
}

const KEY = "rangkul:onboarding-draft";

export const sessionDraftStorage: DraftStorage = {
  read: () => sessionStorage.getItem(KEY),
  write: (value) => sessionStorage.setItem(KEY, value),
  clear: () => sessionStorage.removeItem(KEY),
};

export function parseDraft(raw: string | null): OnboardingDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<OnboardingDraft>;
    if (value.version !== 1 || !value.data || !Number.isInteger(value.step) || value.step! < 1 || value.step! > 5) {
      return null;
    }
    const data = value.data as OnboardingDraftData;
    if (
      typeof data.displayName !== "string"
      || typeof data.birthYear !== "string"
      || typeof data.relationship !== "string"
      || !Array.isArray(data.supportNeeds)
      || !Array.isArray(data.communication)
      || !Array.isArray(data.accessibility)
      || typeof data.primaryLanguage !== "string"
      || typeof data.notes !== "string"
    ) return null;
    const allowed = (options: readonly (readonly [string, string])[]) => new Set(options.map(([code]) => code));
    const birthYear = data.birthYear.replace(/\D/g, "").slice(0, 4);
    const year = birthYear ? Number(birthYear) : null;
    return {
      version: 1,
      step: value.step!,
      data: {
        displayName: sanitizeSingleLine(data.displayName, 100),
        birthYear: year !== null && year >= 1900 && year <= 2026 ? birthYear : "",
        relationship: allowed(relationshipOptions).has(data.relationship) ? data.relationship : "",
        supportNeeds: data.supportNeeds.filter((code) => allowed(supportNeedOptions).has(code)).slice(0, 10),
        communication: data.communication.filter((code) => allowed(communicationOptions).has(code)).slice(0, 10),
        accessibility: data.accessibility.filter((code) => allowed(accessibilityOptions).has(code)).slice(0, 10),
        primaryLanguage: allowed(languageOptions).has(data.primaryLanguage) ? data.primaryLanguage : "id",
        notes: sanitizeMultiline(data.notes, 1000),
      },
    };
  } catch {
    return null;
  }
}
import {
  accessibilityOptions,
  communicationOptions,
  languageOptions,
  relationshipOptions,
  supportNeedOptions,
} from "@/lib/person-options";
import { sanitizeMultiline, sanitizeSingleLine } from "@/lib/validation";
