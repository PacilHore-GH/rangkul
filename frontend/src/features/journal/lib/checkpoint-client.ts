import { api, ApiError } from "@/lib/api";

export type CaptureMode = "voice" | "face_image" | "face_video" | "movement_video" | "multimodal";

export type CheckpointTemplate = {
  id: string;
  code: string;
  name: string;
  modality: string;
  instruction_text: string;
  active: boolean;
};

export type CheckpointRecord = {
  id: string;
  person_profile_id: string;
  template_id: string;
  recommendation_target_id: string | null;
  capture_mode: CaptureMode;
  status: string;
  overall_quality_status: string | null;
  capture_timestamp: string;
  processing_version: number;
  raw_retention_mode: string;
  trend_badge: string | null;
};

export type CheckpointHistoryItem = CheckpointRecord & {
  template_code: string;
  template_name: string;
  has_uploaded_asset: boolean;
  has_results: boolean;
  has_report: boolean;
};

export type CheckpointResults = {
  checkpoint_id: string;
  processing_version: number;
  speech: Record<string, unknown> | null;
  face: Record<string, unknown> | null;
  motion: Record<string, unknown> | null;
  reference_comparison: Record<string, unknown> | null;
  trend: Record<string, unknown> | null;
  limitations: string[];
};

export type CheckpointReport = {
  headline: string;
  observation_summary: string[];
  positive_observations: string[];
  items_for_professional_review: string[];
  adherence_summary: string;
  data_quality_summary: string;
  limitations: string[];
  suggested_review_questions: string[];
  automated_trend_language: string;
  requires_professional_approval: boolean;
};

type PresignedAsset = {
  upload_url: string;
  object_key: string;
  expires_in_seconds: number;
  required_headers: Record<string, string>;
};

export function listTemplates(): Promise<CheckpointTemplate[]> {
  return api("/checkpoint-templates");
}

export function listCheckpoints(personId: string, captureMode?: CaptureMode): Promise<CheckpointHistoryItem[]> {
  const query = captureMode ? `?capture_mode=${encodeURIComponent(captureMode)}` : "";
  return api(`/people/${encodeURIComponent(personId)}/checkpoints${query}`);
}

export function createCheckpoint(
  personId: string,
  templateId: string,
  captureMode: CaptureMode,
): Promise<CheckpointRecord> {
  return api(`/people/${encodeURIComponent(personId)}/checkpoints`, {
    method: "POST",
    body: JSON.stringify({
      template_id: templateId,
      capture_mode: captureMode,
      raw_retention_mode: "privacy_first",
      consent: { capture: true, analysis: true, professional_sharing: true },
      client_request_id: globalThis.crypto.randomUUID(),
    }),
  });
}

export function getCheckpoint(checkpointId: string): Promise<CheckpointRecord> {
  return api(`/checkpoints/${encodeURIComponent(checkpointId)}`);
}

export function presignAsset(checkpointId: string, file: File): Promise<PresignedAsset> {
  return api(`/checkpoints/${encodeURIComponent(checkpointId)}/assets/presign`, {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    }),
  });
}

export async function uploadToLocalStorage(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Media belum berhasil diunggah. Silakan coba lagi.");
  }
}

export function completeAsset(
  checkpointId: string,
  file: File,
  objectKey: string,
  digest: string,
): Promise<CheckpointRecord> {
  return api(`/checkpoints/${encodeURIComponent(checkpointId)}/assets/complete`, {
    method: "POST",
    body: JSON.stringify({
      object_key: objectKey,
      content_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      sha256: digest,
    }),
  });
}

export function submitCheckpoint(checkpointId: string): Promise<CheckpointRecord> {
  return api(`/checkpoints/${encodeURIComponent(checkpointId)}/submit`, { method: "POST" });
}

export function getResults(checkpointId: string): Promise<CheckpointResults> {
  return api(`/checkpoints/${encodeURIComponent(checkpointId)}/results`);
}

export function getReport(checkpointId: string): Promise<CheckpointReport> {
  return api(`/checkpoints/${encodeURIComponent(checkpointId)}/report`);
}

export async function sha256(file: File): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
