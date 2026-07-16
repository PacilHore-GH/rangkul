export interface FacilityService {
  code: string;
  name: string;
  age_min: number;
  age_max: number | null;
  accepts_bpjs: boolean;
  online_booking: boolean;
  accessibility: string[];
}

export interface Facility {
  id: string;
  name: string;
  category: "hospital" | "clinic" | "therapy_center" | "inclusive_school";
  description: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  verification_status: "verified" | "unverified" | "needs_review";
  source_name: string;
  source_url: string | null;
  source_updated_at: string;
  valid_until: string;
  services: FacilityService[];
  active: boolean;
  stale: boolean;
  distance_km: number | null;
}

export interface FacilityList {
  items: Facility[];
  next_cursor: string | null;
}

export interface FacilityReport {
  id: string;
  facility_id: string;
  reason: "wrong_information" | "closed" | "contact" | "service" | "other";
  details: string;
  status: "received" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string | null;
  resolution_note: string | null;
}

export type FacilityInput = Omit<Facility, "id" | "stale" | "distance_km">;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const categoryLabels: Record<Facility["category"], string> = {
  hospital: "Rumah sakit",
  clinic: "Klinik",
  therapy_center: "Pusat terapi",
  inclusive_school: "Sekolah inklusif",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...init,
  });
  if (!response.ok) {
    throw new Error(response.status >= 500 ? "SERVER_ERROR" : "REQUEST_ERROR");
  }
  return response.json();
}

export function searchFacilities(
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<FacilityList> {
  return api(`/facilities?${params.toString()}`, { signal });
}

export function getFacility(id: string, signal?: AbortSignal): Promise<Facility> {
  return api(`/facilities/${encodeURIComponent(id)}`, { signal });
}

export function compareFacilities(ids: string[], signal?: AbortSignal): Promise<Facility[]> {
  return api("/facilities/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facility_ids: ids }),
    signal,
  });
}

export function reportFacility(
  id: string,
  report: { reason: string; details: string },
): Promise<{ id: string; status: "received" }> {
  return api(`/facilities/${encodeURIComponent(id)}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
}

const SAVED_KEY = "rangkul:saved-facilities";

export function getSavedFacilityIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleSavedFacility(id: string): string[] {
  const ids = new Set(getSavedFacilityIds());
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  const saved = [...ids];
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return saved;
}

export function osmCoordinatesEmbedUrl(lat: number, lng: number): string {
  const bbox = `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
}

export function osmEmbedUrl(facility: Facility): string {
  return osmCoordinatesEmbedUrl(facility.latitude, facility.longitude);
}

export function googleMapsDirectionsUrl(facility: Facility): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${facility.latitude},${facility.longitude}`,
    travelmode: "driving",
    dir_action: "navigate",
  });
  return `https://www.google.com/maps/dir/?${params}`;
}

async function adminApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/admin/facilities${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Permintaan admin gagal.");
  }
  return response.json();
}

export function listAdminFacilities(token: string): Promise<Facility[]> {
  return adminApi("", token);
}

export function saveAdminFacility(
  token: string,
  facility: FacilityInput,
  id?: string,
): Promise<Facility> {
  return adminApi(id ? `/${encodeURIComponent(id)}` : "", token, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(facility),
  });
}

export function setAdminFacilityActive(token: string, id: string, active: boolean): Promise<Facility> {
  return adminApi(`/${encodeURIComponent(id)}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function listAdminFacilityReports(token: string): Promise<FacilityReport[]> {
  return adminApi("/reports", token);
}

export function updateAdminFacilityReport(
  token: string,
  id: string,
  status: "reviewing" | "resolved" | "dismissed",
  resolution_note?: string,
): Promise<FacilityReport> {
  return adminApi(`/reports/${encodeURIComponent(id)}`, token, {
    method: "PATCH",
    body: JSON.stringify({ status, resolution_note }),
  });
}
