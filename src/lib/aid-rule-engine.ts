// Deterministic aid rule engine. Never AI-driven. Returns preliminary match only.
import { AID_PROGRAMS, type AidProgram } from "./aid-programs";

export type AidInput = {
  age?: number | null;
  has_disability_flag?: boolean; // Person profile marked with formal disability status
  dtks_or_low_income?: boolean; // Optional user-declared context
};

export type AidMatch = {
  program: AidProgram;
  status: "cocok_awal" | "perlu_data_tambahan" | "belum_cocok";
  missing_requirements: string[];
};

export function matchAid(input: AidInput): AidMatch[] {
  return AID_PROGRAMS.map((program) => {
    const missing: string[] = [];
    const r = program.rule;

    if (r.requires_child && (input.age == null || input.age >= 18)) {
      if (input.age == null) missing.push("Usia belum diisi di profil");
      else missing.push("Program ini untuk usia di bawah 18 tahun");
    }
    if (r.requires_disability_flag && !input.has_disability_flag) {
      missing.push("Surat keterangan disabilitas belum tersedia");
    }
    if (r.requires_dtks_or_low_income && input.dtks_or_low_income == null) {
      missing.push("Status DTKS / kondisi ekonomi belum dikonfirmasi");
    } else if (r.requires_dtks_or_low_income && input.dtks_or_low_income === false) {
      // Not disqualifying — informational only for the demo.
      missing.push("Program ini prioritas untuk keluarga terdaftar DTKS");
    }

    let status: AidMatch["status"];
    if (missing.length === 0) status = "cocok_awal";
    else if (missing.some((m) => m.includes("belum tersedia") || m.includes("di bawah 18")))
      status = "belum_cocok";
    else status = "perlu_data_tambahan";

    return { program, status, missing_requirements: missing };
  });
}
