// Curated government aid programs — used by the deterministic rule engine.
// AI never decides eligibility; it only explains.
export type AidProgram = {
  id: string;
  name: string;
  provider: string;
  summary: string;
  official_source: string;
  official_url: string;
  requirements: string[]; // human-readable
  rule: {
    // Simple flags checked by aid-rule-engine.ts against Person Profile inputs.
    requires_disability_flag?: boolean;
    requires_child?: boolean; // usia < 18
    requires_dtks_or_low_income?: boolean;
    always_available?: boolean;
  };
};

export const AID_PROGRAMS: AidProgram[] = [
  {
    id: "kis-pbi",
    name: "Kartu Indonesia Sehat (PBI-JKN)",
    provider: "Kementerian Kesehatan / BPJS Kesehatan",
    summary:
      "Jaminan kesehatan gratis untuk keluarga tidak mampu terdaftar DTKS. Meliputi layanan di FKTP dan rujukan RS mitra BPJS.",
    official_source: "jkn.kemkes.go.id",
    official_url: "https://www.jkn.kemkes.go.id/",
    requirements: [
      "Terdaftar dalam Data Terpadu Kesejahteraan Sosial (DTKS)",
      "KTP dan KK",
      "Pendaftaran melalui Dinas Sosial setempat",
    ],
    rule: { requires_dtks_or_low_income: true },
  },
  {
    id: "kartu-disabilitas",
    name: "Kartu Penyandang Disabilitas",
    provider: "Kementerian Sosial / Dinas Sosial",
    summary:
      "Identitas resmi yang mempermudah akses layanan publik, transportasi, dan pendaftaran program bantuan disabilitas.",
    official_source: "kemensos.go.id",
    official_url: "https://kemensos.go.id/",
    requirements: [
      "Surat keterangan disabilitas dari dokter/rumah sakit",
      "KK dan KTP orang tua/wali",
      "Pas foto",
      "Pengurusan melalui Dinas Sosial kabupaten/kota",
    ],
    rule: { requires_disability_flag: true },
  },
  {
    id: "pkh",
    name: "Program Keluarga Harapan (PKH)",
    provider: "Kementerian Sosial",
    summary:
      "Bantuan sosial bersyarat untuk keluarga miskin/rentan dengan komponen kesehatan, pendidikan, dan kesejahteraan sosial (termasuk anggota disabilitas berat).",
    official_source: "pkh.kemensos.go.id",
    official_url: "https://pkh.kemensos.go.id/",
    requirements: [
      "Terdaftar DTKS",
      "Memenuhi salah satu komponen (ibu hamil/balita/anak sekolah/lansia/disabilitas berat)",
      "Verifikasi melalui musyawarah desa/kelurahan",
    ],
    rule: { requires_dtks_or_low_income: true },
  },
  {
    id: "bantuan-alat",
    name: "Bantuan Alat Bantu Disabilitas",
    provider: "Kementerian Sosial (Balai Rehabilitasi Sosial)",
    summary:
      "Bantuan alat bantu (kursi roda, alat bantu dengar, kaki palsu, dsb.) melalui pengajuan ke Balai Rehabilitasi Sosial atau Dinas Sosial.",
    official_source: "kemensos.go.id",
    official_url: "https://kemensos.go.id/",
    requirements: [
      "Surat keterangan kebutuhan alat dari tenaga medis",
      "Surat keterangan disabilitas",
      "Pengajuan melalui Dinsos atau balai rehsos terdekat",
    ],
    rule: { requires_disability_flag: true },
  },
  {
    id: "pip",
    name: "Program Indonesia Pintar (PIP)",
    provider: "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi",
    summary:
      "Bantuan pendidikan tunai untuk anak usia sekolah dari keluarga kurang mampu, termasuk siswa SLB dan sekolah inklusi.",
    official_source: "pip.kemdikbud.go.id",
    official_url: "https://pip.kemdikbud.go.id/",
    requirements: [
      "Usia 6–21 tahun",
      "Terdaftar di sekolah/madrasah/SLB",
      "Prioritas pemegang KIP atau keluarga DTKS",
    ],
    rule: { requires_child: true, requires_dtks_or_low_income: true },
  },
  {
    id: "pendidikan-inklusi",
    name: "Akses Pendidikan Inklusi",
    provider: "Kemendikbudristek / Dinas Pendidikan",
    summary:
      "Hak anak dengan kebutuhan khusus untuk bersekolah di sekolah reguler yang menyelenggarakan pendidikan inklusi (UU 8/2016).",
    official_source: "kemdikbud.go.id",
    official_url: "https://www.kemdikbud.go.id/",
    requirements: [
      "Usia sekolah",
      "Konsultasi awal dengan sekolah inklusi terdekat",
      "Asesmen tim pendidik untuk penyusunan program pembelajaran individual",
    ],
    rule: { requires_child: true, always_available: true },
  },
];
