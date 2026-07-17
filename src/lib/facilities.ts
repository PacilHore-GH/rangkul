// Curated facility list for hackathon demo. Not exhaustive; marked as such.
export type Facility = {
  id: string;
  name: string;
  category: "rumah_sakit" | "klinik_terapi" | "slb" | "puskesmas";
  city: string;
  province: string;
  address: string;
  services: string[];
  verification_note: string;
};

export const FACILITIES: Facility[] = [
  {
    id: "rscm",
    name: "RSUPN Dr. Cipto Mangunkusumo",
    category: "rumah_sakit",
    city: "Jakarta Pusat",
    province: "DKI Jakarta",
    address: "Jl. Diponegoro No. 71",
    services: ["Klinik tumbuh kembang", "Neurologi anak", "Rehabilitasi medik"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "rs-sardjito",
    name: "RSUP Dr. Sardjito",
    category: "rumah_sakit",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
    address: "Jl. Kesehatan No. 1, Sekip",
    services: ["Tumbuh kembang anak", "Rehabilitasi medik", "Psikiatri anak"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "rs-hasan-sadikin",
    name: "RSUP Dr. Hasan Sadikin",
    category: "rumah_sakit",
    city: "Bandung",
    province: "Jawa Barat",
    address: "Jl. Pasteur No. 38",
    services: ["Tumbuh kembang", "Terapi wicara", "Fisioterapi"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "rs-soetomo",
    name: "RSUD Dr. Soetomo",
    category: "rumah_sakit",
    city: "Surabaya",
    province: "Jawa Timur",
    address: "Jl. Mayjen Prof. Dr. Moestopo 6-8",
    services: ["Klinik tumbuh kembang", "Rehabilitasi medik anak"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "rs-wahidin",
    name: "RSUP Dr. Wahidin Sudirohusodo",
    category: "rumah_sakit",
    city: "Makassar",
    province: "Sulawesi Selatan",
    address: "Jl. Perintis Kemerdekaan Km. 11",
    services: ["Tumbuh kembang", "Fisioterapi"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "klinik-yamet",
    name: "Klinik Yamet Child Development Center",
    category: "klinik_terapi",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",
    address: "Beberapa cabang di Jabodetabek",
    services: ["Terapi wicara", "Okupasi", "Perilaku (ABA)"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "klinik-anakku",
    name: "Klinik Anakku",
    category: "klinik_terapi",
    city: "Bandung",
    province: "Jawa Barat",
    address: "Jl. Sukajadi",
    services: ["Terapi wicara", "Fisioterapi", "Psikologi anak"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "klinik-medikids",
    name: "Klinik Medikids Surabaya",
    category: "klinik_terapi",
    city: "Surabaya",
    province: "Jawa Timur",
    address: "Jl. Manyar Kertoarjo",
    services: ["Tumbuh kembang", "Terapi okupasi", "Sensori integrasi"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "slb-negeri-1-jkt",
    name: "SLB Negeri 1 Jakarta",
    category: "slb",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",
    address: "Jl. Pertanian, Lebak Bulus",
    services: ["Tunagrahita", "Autis", "Vokasional"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "slb-b-yogya",
    name: "SLB Negeri 2 Yogyakarta",
    category: "slb",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
    address: "Jl. Panembahan Senopati",
    services: ["Tunarungu", "Tunagrahita"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "slb-c-bandung",
    name: "SLB-C YPLB Bandung",
    category: "slb",
    city: "Bandung",
    province: "Jawa Barat",
    address: "Jl. Rajiman",
    services: ["Tunagrahita", "Program keterampilan"],
    verification_note: "Data terkurasi hackathon — verifikasi ulang sebelum kunjungan.",
  },
  {
    id: "puskesmas-tumbang",
    name: "Puskesmas dengan Klinik Tumbuh Kembang",
    category: "puskesmas",
    city: "Berbagai kota",
    province: "Nasional",
    address: "Cek Puskesmas terdekat di wilayah Anda",
    services: ["SDIDTK", "Rujukan awal", "Imunisasi"],
    verification_note:
      "Data terkurasi hackathon — tanyakan ke Puskesmas terdekat tentang layanan SDIDTK.",
  },
];

export const PROVINCES = Array.from(new Set(FACILITIES.map((f) => f.province))).sort();
