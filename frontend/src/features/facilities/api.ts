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
  stale: boolean;
  distance_km: number | null;
}

export interface FacilityList {
  items: Facility[];
  next_cursor: string | null;
}

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

export function osmEmbedUrl(facility: Facility): string {
  const { latitude: lat, longitude: lng } = facility;
  const bbox = `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
}
