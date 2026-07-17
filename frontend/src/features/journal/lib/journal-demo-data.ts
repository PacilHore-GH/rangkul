export const processingSteps = [
  "Checkpoint dibuat",
  "URL upload privat disiapkan",
  "Media berhasil diunggah",
  "Integritas media diverifikasi",
  "Analisis masuk antrean",
  "Fitur observasi diekstrak",
  "Ringkasan draft dibuat",
  "Siap ditinjau profesional",
] as const;

export const reviewQueue = [
  {
    id: "review-voice-001",
    person: "Adit",
    checkpoint: "Repeat Phrase",
    status: "Menunggu review",
    date: "Hari ini, 10.20",
  },
  {
    id: "review-movement-002",
    person: "Nara",
    checkpoint: "Bilateral Arm Raise",
    status: "Perlu perhatian",
    date: "Kemarin, 16.45",
  },
] as const;
