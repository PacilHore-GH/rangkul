# Authentication dan Family Onboarding

Jalankan seluruh stack dengan `docker compose up --build`. Backend memakai PostgreSQL pada Docker dan SQLite sebagai fallback lokal untuk menjalankan test cepat.

Sebelum deployment, tetapkan `DATABASE_URL`, `JWT_SECRET_KEY` yang panjang dan unik, serta `COOKIE_SECURE=True`. Untuk skema production, jalankan dari folder `backend`: `alembic upgrade head`.

Endpoint utama berada pada `/api/v1/auth` dan `/api/v1/people`. Link reset hanya dicetak ke log backend untuk demo lokal; implementasikan mailer provider sebelum produksi.
