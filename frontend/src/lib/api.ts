// ponytail: plain fetch, no axios/ky dependency
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AidProgram {
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
  rule_version_count?: number;
}

export interface AidRule {
  id: string;
  program_id: string;
  version: number;
  status: "draft" | "published" | "archived";
  rule_json: Record<string, unknown>;
  human_summary: string;
  created_at: string;
  published_at: string | null;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Aid Programs ---

export function getAidPrograms() {
  return api<AidProgram[]>("/api/v1/aid-programs");
}

export function getAidProgram(id: string) {
  return api<AidProgram>(`/api/v1/aid-programs/${id}`);
}

export function createAidProgram(data: Partial<AidProgram>) {
  return api<AidProgram>("/api/v1/aid-programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAidProgram(id: string, data: Partial<AidProgram>) {
  return api<AidProgram>(`/api/v1/aid-programs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAidProgram(id: string) {
  return api<void>(`/api/v1/aid-programs/${id}`, { method: "DELETE" });
}

// --- Aid Rules ---

export function getAidRules(programId: string) {
  return api<AidRule[]>(`/api/v1/aid-programs/${programId}/rules`);
}

export function createAidRule(
  programId: string,
  data: { rule_json: Record<string, unknown>; human_summary: string }
) {
  return api<AidRule>(`/api/v1/aid-programs/${programId}/rules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function publishAidRule(programId: string, ruleId: string) {
  return api<AidRule>(
    `/api/v1/aid-programs/${programId}/rules/${ruleId}/publish`,
    { method: "POST" }
  );
}
