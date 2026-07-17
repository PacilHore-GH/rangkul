-- Idempotent public catalog seed. Synthetic/demo records are explicitly marked.
insert into public.support_needs(code,label,description,sort_order) values
('communication','Komunikasi','Cara memahami dan mengekspresikan kebutuhan.',1),
('sensory','Sensori','Preferensi dan pemicu sensori sehari-hari.',2),
('mobility','Mobilitas','Dukungan berpindah tempat dan posisi.',3),
('daily_living','Kehidupan sehari-hari','Rutinitas makan, berpakaian, dan perawatan diri.',4),
('learning','Belajar','Strategi dan lingkungan belajar.',5),
('behavioral_support','Dukungan perilaku','Pengamatan pemicu dan strategi dukungan aman.',6),
('social_interaction','Interaksi sosial','Dukungan berinteraksi dan berpartisipasi.',7),
('therapy_support','Dukungan terapi','Persiapan dan koordinasi dengan profesional.',8)
on conflict(code) do update set label=excluded.label,description=excluded.description,sort_order=excluded.sort_order;

insert into public.facilities(id,name,category,city,address,latitude,longitude,services,accepts_bpjs,accessibility,phone,official_url,is_demo) values
('10000000-0000-4000-8000-000000000001','RSUPN Dr. Cipto Mangunkusumo','hospital','Jakarta','Jl. Diponegoro No. 71',-6.1962,106.8480,array['klinik perkembangan','rehabilitasi medik'],true,array['akses kursi roda'],'1500135','https://rscm.co.id',true),
('10000000-0000-4000-8000-000000000002','RSUP Dr. Sardjito','hospital','Yogyakarta','Jl. Kesehatan No. 1',-7.7686,110.3733,array['klinik perkembangan','fisioterapi'],true,array['akses kursi roda'],'0274631190','https://sardjito.co.id',true),
('10000000-0000-4000-8000-000000000003','Klinik Tumbuh Bersama Demo','developmental_clinic','Bandung','Jl. Demo Inklusif No. 8',-6.9175,107.6191,array['terapi wicara','psikologi'],false,array['ruang tenang'],null,'https://example.org/fasilitas-demo',true),
('10000000-0000-4000-8000-000000000004','Pusat Terapi Wicara Sahabat Demo','speech_therapy','Surabaya','Jl. Contoh No. 12',-7.2575,112.7521,array['terapi wicara'],false,array['akses kursi roda'],null,'https://example.org/fasilitas-demo',true),
('10000000-0000-4000-8000-000000000005','Klinik Okupasi Mandiri Demo','occupational_therapy','Makassar','Jl. Perintis Demo No. 3',-5.1477,119.4327,array['terapi okupasi','sensori'],false,array['parkir aksesibel'],null,'https://example.org/fasilitas-demo',true),
('10000000-0000-4000-8000-000000000006','Fisioterapi Gerak Baik Demo','physiotherapy','Semarang','Jl. Pemuda Demo No. 4',-6.9667,110.4167,array['fisioterapi'],true,array['akses kursi roda'],null,'https://example.org/fasilitas-demo',true),
('10000000-0000-4000-8000-000000000007','SLB Negeri Demo Rangkul','special_school','Malang','Jl. Pendidikan Demo No. 2',-7.9666,112.6326,array['pendidikan khusus','vokasional'],false,array['toilet aksesibel'],null,'https://example.org/fasilitas-demo',true),
('10000000-0000-4000-8000-000000000008','Sekolah Inklusif Pelita Demo','inclusive_school','Depok','Jl. Inklusi Demo No. 10',-6.4025,106.7942,array['pendidikan inklusif','pendamping belajar'],false,array['ruang tenang'],null,'https://example.org/fasilitas-demo',true)
on conflict(id) do update set name=excluded.name,services=excluded.services,accepts_bpjs=excluded.accepts_bpjs;

insert into public.aid_programs(id,code,name,category,provider,summary,official_url,rules,requirements,rules_version,is_demo) values
('20000000-0000-4000-8000-000000000001','PKH-DIS','Program Keluarga Harapan – Komponen Disabilitas','social_assistance','Kementerian Sosial','Dukungan sosial dengan verifikasi resmi.','https://kemensos.go.id', '{"requires_dtks_or_low_income":true}', '["NIK","Kartu Keluarga","verifikasi DTKS"]','2026.1',true),
('20000000-0000-4000-8000-000000000002','ATENSI','Asistensi Rehabilitasi Sosial','rehabilitation','Kementerian Sosial','Dukungan rehabilitasi sosial sesuai asesmen instansi.','https://kemensos.go.id', '{"requires_disability_flag":true}', '["identitas","asesmen sosial"]','2026.1',true),
('20000000-0000-4000-8000-000000000003','KIS-PBI','Penerima Bantuan Iuran JKN','health','BPJS Kesehatan','Bantuan iuran jaminan kesehatan bagi peserta yang memenuhi ketentuan.','https://bpjs-kesehatan.go.id', '{"requires_dtks_or_low_income":true}', '["NIK","Kartu Keluarga","status sosial ekonomi"]','2026.1',true),
('20000000-0000-4000-8000-000000000004','KPD','Kartu Penyandang Disabilitas','identity','Kementerian Sosial','Identitas layanan disabilitas sesuai ketentuan daerah dan pusat.','https://kemensos.go.id', '{"requires_disability_flag":true}', '["NIK","dokumen pendukung disabilitas"]','2026.1',true),
('20000000-0000-4000-8000-000000000005','PIP','Program Indonesia Pintar','education','Kemendikdasmen','Dukungan pendidikan bagi peserta didik yang memenuhi ketentuan.','https://pip.kemdikbud.go.id', '{"requires_child":true,"requires_dtks_or_low_income":true}', '["NISN","identitas keluarga","status sekolah"]','2026.1',true),
('20000000-0000-4000-8000-000000000006','BANSOS-DAERAH','Layanan Sosial Daerah','regional','Dinas Sosial','Rujukan program daerah; ketersediaan berbeda tiap wilayah.','https://cekbansos.kemensos.go.id', '{}', '["NIK","domisili"]','2026.1',true),
('20000000-0000-4000-8000-000000000007','ALAT-BANTU','Dukungan Alat Bantu','assistive_device','Kementerian Sosial / daerah','Permohonan alat bantu sesuai asesmen dan ketersediaan.','https://kemensos.go.id', '{"requires_disability_flag":true}', '["identitas","rekomendasi kebutuhan alat bantu"]','2026.1',true)
on conflict(code) do update set summary=excluded.summary,rules=excluded.rules,requirements=excluded.requirements,rules_version=excluded.rules_version;

insert into public.knowledge_sources(id,title,publisher,official_url,reviewed_at) values
('30000000-0000-4000-8000-000000000001','Panduan layanan kesehatan','Kementerian Kesehatan','https://kemkes.go.id','2026-07-01'),
('30000000-0000-4000-8000-000000000002','Panduan bantuan sosial','Kementerian Sosial','https://kemensos.go.id','2026-07-01'),
('30000000-0000-4000-8000-000000000003','Sumber dukungan keluarga','Rangkul – kurasi demo','https://example.org/rangkul-demo','2026-07-01')
on conflict(id) do update set reviewed_at=excluded.reviewed_at;
insert into public.knowledge_documents(id,source_id,topic,title,body,version) values
('31000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','therapy_preparation','Persiapan konsultasi','Catat tujuan, perubahan yang diamati, pertanyaan, dan dokumen yang diminta fasilitas.','1'),
('31000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','government_aid','Verifikasi bantuan','Pencocokan awal tidak menggantikan keputusan instansi. Gunakan tautan resmi untuk syarat terbaru.','1'),
('31000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000003','daily_support','Dukungan harian','Mulai dari langkah kecil, konsisten, dan catat respons tanpa menyimpulkan diagnosis.','1')
on conflict(id) do update set body=excluded.body,version=excluded.version;
insert into public.knowledge_chunks(id,document_id,content) values
('32000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001','Sebelum konsultasi, susun tiga pertanyaan utama dan catatan pengamatan faktual.'),
('32000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000001','Bawa daftar dukungan yang sudah dicoba dan respons yang diamati.'),
('32000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000001','Tanyakan tujuan, cara latihan aman, tanda berhenti, dan jadwal evaluasi.'),
('32000000-0000-4000-8000-000000000004','31000000-0000-4000-8000-000000000002','Kelayakan bantuan diputuskan instansi berdasarkan verifikasi dokumen.'),
('32000000-0000-4000-8000-000000000005','31000000-0000-4000-8000-000000000002','Jangan mengirim dokumen medis melalui layanan yang tidak resmi.'),
('32000000-0000-4000-8000-000000000006','31000000-0000-4000-8000-000000000002','Simpan nomor pengajuan dan tanggal tindak lanjut.'),
('32000000-0000-4000-8000-000000000007','31000000-0000-4000-8000-000000000003','Gunakan instruksi singkat satu langkah dan beri waktu respons.'),
('32000000-0000-4000-8000-000000000008','31000000-0000-4000-8000-000000000003','Kurangi rangsangan yang mengganggu berdasarkan preferensi individu.'),
('32000000-0000-4000-8000-000000000009','31000000-0000-4000-8000-000000000003','Jadwal visual dapat membantu transisi kegiatan sehari-hari.'),
('32000000-0000-4000-8000-000000000010','31000000-0000-4000-8000-000000000003','Catat konteks sebelum dan sesudah suatu respons, tanpa label klinis.'),
('32000000-0000-4000-8000-000000000011','31000000-0000-4000-8000-000000000003','Koordinasikan strategi keluarga dengan profesional yang tertaut.'),
('32000000-0000-4000-8000-000000000012','31000000-0000-4000-8000-000000000003','Dalam situasi darurat, hubungi layanan darurat setempat; jangan menunggu jawaban AI.')
on conflict(id) do update set content=excluded.content;
