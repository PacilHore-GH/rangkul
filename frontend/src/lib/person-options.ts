export const supportNeedOptions = [
  ["communication", "Komunikasi"],
  ["learning", "Belajar"],
  ["mobility", "Mobilitas"],
  ["sensory", "Sensori"],
  ["daily_living", "Aktivitas harian"],
  ["social_emotional", "Sosial & emosi"],
] as const;

export const communicationOptions = [
  ["short_instructions", "Instruksi singkat"],
  ["visual_support", "Dukungan visual"],
  ["gesture", "Gestur"],
  ["aac", "AAC / alat bantu komunikasi"],
  ["sign_language", "Bahasa isyarat"],
  ["extra_processing_time", "Waktu memproses lebih panjang"],
] as const;

export const accessibilityOptions = [
  ["reduced_noise", "Lingkungan lebih tenang"],
  ["reduced_motion", "Gerakan visual dikurangi"],
  ["high_contrast", "Kontras tinggi"],
  ["large_text", "Teks lebih besar"],
  ["wheelchair_access", "Akses kursi roda"],
  ["quiet_space", "Ruang tenang"],
] as const;

export const languageOptions = [
  ["id", "Bahasa Indonesia"],
  ["en", "English"],
  ["jv", "Basa Jawa"],
  ["su", "Basa Sunda"],
] as const;
