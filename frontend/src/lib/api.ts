const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function createIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

type ValidationIssue = {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
};

const fieldLabels: Record<string, string> = {
  email: "email",
  password: "kata sandi",
  new_password: "kata sandi baru",
  full_name: "nama",
  display_name: "nama panggilan",
  birth_year: "tahun lahir",
  support_needs: "kebutuhan dukungan",
  notes: "catatan",
  consent: "persetujuan",
  terms_accepted: "persetujuan syarat penggunaan",
  token: "tautan reset",
};

function validationMessage(issue: ValidationIssue): string {
  const field = String(issue.loc?.at(-1) ?? "");
  const label = fieldLabels[field] ?? "data";
  const message = issue.msg?.toLowerCase() ?? "";

  if (field === "email") return "Masukkan alamat email yang valid, misalnya nama@mail.com.";
  if (field === "password" || field === "new_password") {
    if (message.includes("at least") || issue.type === "string_too_short") return "Kata sandi harus terdiri dari minimal 12 karakter.";
    if (message.includes("at most") || issue.type === "string_too_long") return "Kata sandi tidak boleh lebih dari 128 karakter.";
    return issue.msg ?? "Kata sandi belum memenuhi ketentuan keamanan.";
  }
  if (issue.type === "extra_forbidden") return `Kolom ${field || "tersebut"} tidak diperbolehkan.`;
  if (issue.type === "missing") return `Mohon isi ${label}.`;
  if (message.includes("greater than or equal")) return `${label[0].toUpperCase()}${label.slice(1)} terlalu kecil.`;
  if (message.includes("less than or equal")) return `${label[0].toUpperCase()}${label.slice(1)} melebihi batas yang diperbolehkan.`;
  if (message.includes("too long")) return `${label[0].toUpperCase()}${label.slice(1)} terlalu panjang.`;
  if (message.includes("too short")) return `Mohon isi ${label}.`;
  return issue.msg ?? `Periksa kembali ${label}.`;
}

function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return [...new Set(detail.map((issue: ValidationIssue) => validationMessage(issue)))].join(" ");
  }
  return "Permintaan belum berhasil diproses. Silakan coba lagi.";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const fallback = response.status >= 500
      ? "Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat."
      : errorMessage(body?.detail);
    throw new ApiError(response.status, fallback);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type CurrentUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  has_profile: boolean;
  onboarding_completed: boolean;
};
export type Person = {
  id: string;
  display_name: string;
  birth_year: number | null;
  support_needs: string[];
  communication_preferences: string[];
  accessibility_preferences: string[];
  primary_language: string;
  notes: string | null;
  caregiver_relationship: string;
  completeness: {
    percentage: number;
    sections: Array<{ code: string; completed: boolean }>;
  };
};

export type Facility = {
  id: string;
  name: string;
  facility_type: string;
  description: string | null;
  services: string[];
  address: string;
  city: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  source_name: string;
  source_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AidProgram = {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  jurisdiction: string;
  official_url: string | null;
  verification_status: "unverified" | "verified";
  is_active: boolean;
  current_rule_version: number | null;
  created_at: string;
  updated_at: string;
};

export type AidRule = {
  id: string;
  program_id: string;
  version: number;
  status: "draft" | "published" | "archived";
  rule_json: Record<string, unknown>;
  human_summary: string;
  created_at: string;
  published_at: string | null;
};

export function getAidPrograms() {
  return api<AidProgram[]>("/aid-programs");
}

export function getAidProgram(id: string) {
  return api<AidProgram>(`/aid-programs/${id}`);
}

export function createAidProgram(data: Partial<AidProgram>) {
  return api<AidProgram>("/aid-programs", { method: "POST", body: JSON.stringify(data) });
}

export function updateAidProgram(id: string, data: Partial<AidProgram>) {
  return api<AidProgram>(`/aid-programs/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteAidProgram(id: string) {
  return api<void>(`/aid-programs/${id}`, { method: "DELETE" });
}

export function getAidRules(programId: string) {
  return api<AidRule[]>(`/aid-programs/${programId}/rules`);
}

export function createAidRule(programId: string, data: { rule_json: Record<string, unknown>; human_summary: string }) {
  return api<AidRule>(`/aid-programs/${programId}/rules`, { method: "POST", body: JSON.stringify(data) });
}

export function publishAidRule(programId: string, ruleId: string) {
  return api<AidRule>(`/aid-programs/${programId}/rules/${ruleId}/publish`, { method: "PATCH" });
}
