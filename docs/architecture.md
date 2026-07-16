# Modular Monolith Architecture

Rangkul menggunakan **modular monolith**: satu deployment dan satu database untuk kecepatan hackathon, dengan batas kode per domain agar fitur dapat tumbuh tanpa menjadi monolit tidak terstruktur.

## Batas modul

- `app/modules/identity`: akun Family, credential, session, dan password reset.
- `app/modules/people`: Person Profile, consent, dan kebutuhan dukungan.
- `app/core`: konfigurasi lintas-modul.
- `app/db.py`: engine dan dependency database bersama.

Route publik hanya melakukan komposisi di `app/api/router.py`. Modul tidak boleh mengimpor router modul lain; integrasi lintas-modul melalui service/port kecil. Saat Journal, Roadmap, AI, Facility, dan Aid dibuat, masing-masing harus mengikuti struktur `app/modules/<feature>/{router,service,schemas,repository}.py`.

Frontend mengikuti batas yang sama: route App Router tetap tipis dan UI/domain logic baru ditempatkan pada `src/features/<feature>`. `src/lib` hanya untuk infrastruktur lintas-fitur seperti HTTP client.

## Skalabilitas operasional

API stateless selain cookie yang tervalidasi terhadap tabel `sessions`, sehingga instance backend dapat ditambah horizontal. PostgreSQL merupakan source of truth; index unik email, index session per user, rate-limit counters, idempotency records, dan beberapa Person Profile per caregiver sudah disediakan. Redis/queue belum ditambahkan karena belum dibutuhkan MVP; policy rate limit dan adapter mailer dapat diganti implementasinya tanpa mengubah kontrak HTTP.
