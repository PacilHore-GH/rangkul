# Authentication dan Family Onboarding

Jalankan seluruh stack dengan `docker compose up --build`. Backend memakai PostgreSQL pada Docker dan SQLite sebagai fallback lokal untuk menjalankan test cepat.

Sebelum deployment, tetapkan `DATABASE_URL`, `JWT_SECRET_KEY` yang panjang dan unik, `COOKIE_SECURE=True`, dan `COOKIE_SAMESITE=lax`. Frontend memakai proxy same-origin `/api/v1`, dikonfigurasi melalui server-side `BACKEND_URL`, sehingga JWT tetap berada dalam cookie HttpOnly first-party. Untuk skema production, jalankan dari folder `backend`: `alembic upgrade head`.

Endpoint utama berada pada `/api/v1/auth` dan `/api/v1/people`. Adapter mailer console menulis link reset ke log hanya untuk development lokal; implementasikan adapter provider email sebelum produksi.

Onboarding disimpan sebagai milestone akun dan tidak bergantung pada keberadaan Person Profile. Profil pertama dibuat saat onboarding; setelah itu caregiver dapat menambah dan mengelola beberapa orang yang didampingi tanpa mengulangi onboarding.

Database Docker lama yang dibuat sebelum Alembic akan diadopsi otomatis tanpa menghapus data. Jalankan `docker compose up --build`; backend menjalankan `alembic upgrade head` sebelum API dimulai. Gunakan `docker compose down -v` hanya bila memang ingin menghapus seluruh data development.

Input mutation memakai schema strict dan menolak field asing seperti `role`, `owner_user_id`, atau timestamp server. Request reset password selalu memberi respons generik; pengiriman dilakukan melalui port mailer dengan adapter console untuk development dan fake untuk test.

Endpoint auth publik memakai rate limit berbasis PostgreSQL. Mutation berbasis cookie memvalidasi `Origin`/`Referer` terhadap `TRUSTED_ORIGINS`. Create onboarding dan Person Profile wajib membawa header UUID `Idempotency-Key`; retry key dan payload yang sama mengembalikan hasil pertama, sedangkan payload berbeda menghasilkan `409`.

Onboarding memiliki lima tahap: data dasar dan hubungan caregiver, kebutuhan dukungan, preferensi komunikasi/aksesibilitas, catatan, serta review dan consent. Draft disimpan sementara di `sessionStorage` dan consent tidak pernah disimpan sebagai draft. Preferensi disimpan sebagai katalog JSON tervalidasi dan tetap dapat diedit dari pengelolaan profil.

Dashboard menyediakan Active Person Switcher. Pilihan disimpan per user di browser dan diekspos melalui `ActivePersonProvider`, sehingga Journal, Roadmap, AI, Aid, dan Facility dapat memakai profil aktif yang sama. Kelengkapan profil dihitung backend melalui policy section yang extensible; nilainya bukan asesmen atau diagnosis.

Role Admin tidak tersedia melalui registrasi publik. Admin login melalui `/admin/login`, melewati onboarding, dan ditolak oleh semua endpoint People.
