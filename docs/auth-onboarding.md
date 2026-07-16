# Authentication dan Family Onboarding

Jalankan seluruh stack dengan `docker compose up --build`. Backend memakai PostgreSQL pada Docker dan SQLite sebagai fallback lokal untuk menjalankan test cepat.

Sebelum deployment, tetapkan `DATABASE_URL`, `JWT_SECRET_KEY` yang panjang dan unik, `COOKIE_SECURE=True`, dan `COOKIE_SAMESITE=lax`. Frontend memakai proxy same-origin `/api/v1`, dikonfigurasi melalui server-side `BACKEND_URL`, sehingga JWT tetap berada dalam cookie HttpOnly first-party. Untuk skema production, jalankan dari folder `backend`: `alembic upgrade head`.

Endpoint utama berada pada `/api/v1/auth` dan `/api/v1/people`. Link reset hanya dicetak ke log backend untuk demo lokal; implementasikan mailer provider sebelum produksi.

Onboarding disimpan sebagai milestone akun dan tidak bergantung pada keberadaan Person Profile. Profil pertama dibuat saat onboarding; setelah itu caregiver dapat menambah dan mengelola beberapa orang yang didampingi tanpa mengulangi onboarding.

Database Docker lama yang dibuat sebelum Alembic akan diadopsi otomatis tanpa menghapus data. Jalankan `docker compose up --build`; backend menjalankan `alembic upgrade head` sebelum API dimulai. Gunakan `docker compose down -v` hanya bila memang ingin menghapus seluruh data development.
