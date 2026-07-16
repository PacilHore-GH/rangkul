# Admin dan Katalog Fasilitas

Admin merupakan akun internal untuk CRUD data eksternal. Registrasi publik tetap menghasilkan role `family`; role `professional` belum aktif.

Endpoint baca `/api/v1/facilities` memerlukan session Family atau Admin. Family hanya menerima fasilitas aktif. Endpoint `/api/v1/admin/facilities` memerlukan role Admin dan menyediakan list seluruh data, create idempotent, update, serta hard delete untuk kebutuhan demo.

Admin tidak memiliki akses ke `/api/v1/people`. Menambah katalog eksternal berikutnya, seperti program bantuan, harus membuat bounded module baru dan menggunakan dependency `require_role("admin")`, bukan memperluas tabel Facilities atau memberikan akses Admin ke data keluarga.
