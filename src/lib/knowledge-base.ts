// Curated knowledge base for Rangkul AI Assistant (hackathon MVP).
// Sources are real, publicly available materials; content is condensed paraphrase.
// Never present as diagnosis — always cite source and add limitation note.

export type KnowledgeEntry = {
  id: string;
  title: string;
  source: string;
  source_url: string;
  category: string;
  content: string;
  keywords: string[];
};

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "autism-overview",
    title: "Autism Spectrum: pengenalan dan dukungan awal",
    source: "WHO — Autism",
    source_url: "https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders",
    category: "autism",
    content:
      "Autisme adalah kondisi perkembangan neurologis yang memengaruhi cara seseorang berkomunikasi, berinteraksi sosial, dan memproses sensori. Dukungan awal melalui terapi perilaku, wicara, dan okupasi terbukti membantu perkembangan. Setiap anak berbeda; intervensi yang efektif adalah yang disesuaikan dengan kekuatan dan kebutuhan spesifik anak.",
    keywords: ["autis", "autism", "asd", "spektrum", "sensori", "komunikasi sosial"],
  },
  {
    id: "down-syndrome",
    title: "Down Syndrome: tumbuh kembang dan dukungan keluarga",
    source: "Kemenkes RI — Pedoman Deteksi Dini Down Syndrome",
    source_url: "https://kemkes.go.id/",
    category: "down-syndrome",
    content:
      "Down syndrome adalah kondisi genetik akibat trisomi 21. Anak dengan Down syndrome memiliki potensi belajar; pendampingan meliputi stimulasi tumbuh kembang, terapi wicara, fisik, dan okupasi. Pemeriksaan jantung dan tiroid rutin dianjurkan sejak dini.",
    keywords: ["down", "trisomi", "trisomy 21", "sindrom"],
  },
  {
    id: "cerebral-palsy",
    title: "Cerebral Palsy: intervensi motorik dan komunikasi",
    source: "WHO — Cerebral Palsy",
    source_url: "https://www.who.int/news-room/fact-sheets/detail/disability-and-health",
    category: "cerebral-palsy",
    content:
      "Cerebral palsy memengaruhi gerakan dan postur karena gangguan pada otak yang sedang berkembang. Terapi fisik, okupasi, dan wicara membantu memaksimalkan kemandirian. Alat bantu adaptif dapat mendukung mobilitas dan komunikasi.",
    keywords: ["cerebral palsy", "cp", "lumpuh otak", "motorik"],
  },
  {
    id: "adhd",
    title: "ADHD pada anak: strategi rumah dan sekolah",
    source: "WHO / Kemenkes — Kesehatan Jiwa Anak",
    source_url: "https://www.who.int/health-topics/mental-health",
    category: "adhd",
    content:
      "ADHD (Attention Deficit Hyperactivity Disorder) melibatkan kesulitan fokus, hiperaktivitas, dan impulsivitas. Strategi lingkungan yang terstruktur, jadwal visual, jeda gerak, dan penguatan positif dapat sangat membantu. Konsultasikan dengan psikolog atau psikiater anak untuk asesmen menyeluruh.",
    keywords: ["adhd", "hiperaktif", "fokus", "atensi", "gpph"],
  },
  {
    id: "early-detection",
    title: "Deteksi dini penyimpangan tumbuh kembang (SDIDTK)",
    source: "Kemenkes RI — Buku SDIDTK",
    source_url: "https://kemkes.go.id/",
    category: "deteksi-dini",
    content:
      "Stimulasi, Deteksi, dan Intervensi Dini Tumbuh Kembang (SDIDTK) adalah program Kemenkes untuk memantau tumbuh kembang anak 0–6 tahun. Skrining meliputi motorik kasar/halus, bicara-bahasa, sosial, dan kemampuan bantu diri. Hasil skrining bukan diagnosis; jika ada temuan, lanjutkan ke tenaga profesional.",
    keywords: ["sdidtk", "deteksi dini", "tumbuh kembang", "skrining", "posyandu"],
  },
  {
    id: "speech-therapy",
    title: "Terapi wicara: kapan mempertimbangkan",
    source: "WHO — Developmental Difficulties",
    source_url: "https://www.who.int/",
    category: "terapi",
    content:
      "Terapi wicara membantu anak yang mengalami keterlambatan bicara, kesulitan artikulasi, atau tantangan komunikasi sosial. Sesi biasanya melibatkan permainan interaktif dan latihan yang bisa dilanjutkan orang tua di rumah. Konsistensi jauh lebih penting daripada durasi.",
    keywords: ["terapi wicara", "speech", "bicara", "bahasa"],
  },
  {
    id: "occupational-therapy",
    title: "Terapi okupasi untuk kemandirian sehari-hari",
    source: "WHO — Rehabilitation",
    source_url: "https://www.who.int/health-topics/rehabilitation",
    category: "terapi",
    content:
      "Terapi okupasi fokus pada aktivitas sehari-hari: makan, berpakaian, menulis, dan integrasi sensori. Terapis okupasi merancang latihan yang menyenangkan sesuai minat anak untuk membangun kemandirian secara bertahap.",
    keywords: ["okupasi", "occupational", "kemandirian", "sensori integrasi"],
  },
  {
    id: "physical-therapy",
    title: "Fisioterapi untuk anak dengan kebutuhan motorik",
    source: "WHO — Rehabilitation",
    source_url: "https://www.who.int/health-topics/rehabilitation",
    category: "terapi",
    content:
      "Fisioterapi anak membantu mengembangkan kekuatan, postur, keseimbangan, dan pola gerak. Latihan disesuaikan usia dan kondisi. Fisioterapis juga mengedukasi keluarga tentang posisi dan gerakan yang aman di rumah.",
    keywords: ["fisioterapi", "fisik", "motorik kasar"],
  },
  {
    id: "sensory-needs",
    title: "Kebutuhan sensori: mengelola stimulus di rumah",
    source: "WHO — Autism Spectrum",
    source_url: "https://www.who.int/",
    category: "sensori",
    content:
      "Beberapa anak sangat sensitif terhadap suara, cahaya, atau tekstur, sementara yang lain justru mencari stimulus intens. Ruang tenang, jadwal visual, dan alat bantu sensori (fidget, headphone peredam) dapat membantu regulasi emosi.",
    keywords: ["sensori", "sensory", "stimulus", "regulasi"],
  },
  {
    id: "intellectual-disability",
    title: "Disabilitas intelektual: dukungan pendidikan",
    source: "WHO — Intellectual Disability",
    source_url: "https://www.who.int/",
    category: "intelektual",
    content:
      "Anak dengan disabilitas intelektual belajar dengan tempo berbeda. Pengulangan, instruksi visual, dan pemecahan tugas menjadi langkah kecil sangat membantu. Sekolah Luar Biasa (SLB) atau sekolah inklusi dapat menjadi pilihan sesuai kebutuhan.",
    keywords: ["intelektual", "id", "iq", "belajar", "slb"],
  },
  {
    id: "hearing-vision",
    title: "Dukungan untuk kebutuhan pendengaran dan penglihatan",
    source: "WHO — Disability and Health",
    source_url: "https://www.who.int/news-room/fact-sheets/detail/disability-and-health",
    category: "sensori-fisik",
    content:
      "Deteksi dini gangguan pendengaran dan penglihatan sangat penting untuk perkembangan bahasa dan belajar. Alat bantu dengar, kaca mata khusus, atau bahasa isyarat dapat membuka akses komunikasi. Skrining OAE untuk pendengaran bayi tersedia di banyak rumah sakit.",
    keywords: ["tuli", "buta", "pendengaran", "penglihatan", "isyarat"],
  },
  {
    id: "kis-pbi",
    title: "Kartu Indonesia Sehat / PBI-JKN",
    source: "Kemenkes — JKN-KIS",
    source_url: "https://www.jkn.kemkes.go.id/",
    category: "bantuan",
    content:
      "Kartu Indonesia Sehat (KIS) untuk peserta PBI-JKN memberikan akses layanan kesehatan gratis di fasilitas kesehatan mitra BPJS. Anak dari keluarga dalam Data Terpadu Kesejahteraan Sosial (DTKS) dapat didaftarkan melalui Dinsos setempat.",
    keywords: ["kis", "pbi", "jkn", "bpjs", "kesehatan"],
  },
  {
    id: "pkh",
    title: "Program Keluarga Harapan (PKH)",
    source: "Kemensos RI — PKH",
    source_url: "https://pkh.kemensos.go.id/",
    category: "bantuan",
    content:
      "PKH adalah bantuan sosial bersyarat untuk keluarga miskin/rentan dengan komponen kesehatan, pendidikan, dan kesejahteraan sosial (termasuk anggota keluarga penyandang disabilitas berat dan lansia). Pendaftaran melalui musdes/muskel dan verifikasi DTKS.",
    keywords: ["pkh", "keluarga harapan", "bansos", "kemensos"],
  },
  {
    id: "kartu-disabilitas",
    title: "Kartu Penyandang Disabilitas",
    source: "Kemensos RI",
    source_url: "https://kemensos.go.id/",
    category: "bantuan",
    content:
      "Kartu Penyandang Disabilitas adalah identitas resmi yang memudahkan akses layanan publik dan program bantuan. Pengurusan melalui Dinas Sosial dengan surat keterangan disabilitas dari dokter dan dokumen pendukung (KK, KTP orang tua/wali).",
    keywords: ["kartu disabilitas", "disabilitas", "kpd", "dinsos"],
  },
  {
    id: "hak-difabel",
    title: "Hak penyandang disabilitas di Indonesia (UU 8/2016)",
    source: "UU No. 8 Tahun 2016 tentang Penyandang Disabilitas",
    source_url: "https://peraturan.bpk.go.id/Details/37251",
    category: "hak",
    content:
      "UU No. 8/2016 menjamin hak penyandang disabilitas atas pendidikan, kesehatan, pekerjaan, aksesibilitas, dan perlindungan hukum. Sekolah wajib menerima anak disabilitas melalui pendidikan inklusi; pemerintah daerah bertanggung jawab menyediakan aksesibilitas.",
    keywords: ["hak", "uu", "undang", "difabel", "inklusi"],
  },
];

// Simple keyword-overlap retrieval — good enough for hackathon RAG demo.
export function retrieveKnowledge(query: string, limit = 3): KnowledgeEntry[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = KNOWLEDGE_BASE.map((entry) => {
    const haystack = (
      entry.title +
      " " +
      entry.content +
      " " +
      entry.keywords.join(" ")
    ).toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (entry.keywords.some((k) => k.includes(t))) score += 3;
      if (haystack.includes(t)) score += 1;
    }
    return { entry, score };
  });

  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  // Fallback: return 3 general entries so the assistant always has grounding.
  if (top.length === 0) {
    return KNOWLEDGE_BASE.filter((e) =>
      ["early-detection", "hak-difabel", "kis-pbi"].includes(e.id),
    );
  }
  return top.map((s) => s.entry);
}
