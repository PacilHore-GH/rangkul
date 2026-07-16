# Development workflow

## Mengaktifkan pre-commit quality gate

Jalankan sekali setelah clone:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-git-hooks.ps1
```

Hook akan membatalkan commit bila salah satu pemeriksaan berikut gagal:

1. Backend Ruff
2. Seluruh backend pytest
3. Frontend ESLint
4. Seluruh frontend Vitest

Quality gate dapat dijalankan manual dengan:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\precommit.ps1
```

Hook sengaja tidak menyediakan bypass di dalam script. Git tetap memiliki opsi
standar `--no-verify`, tetapi opsi tersebut tidak boleh digunakan dalam workflow
proyek. CI dan branch protection tetap menjadi perlindungan akhir untuk perubahan
yang dikirim ke remote.

Runner mengisolasi environment backend test (`DEBUG=False`, SQLite test database,
secret test, dan cookie non-secure), sehingga variabel dari IDE, Git client, Docker,
atau environment deployment tidak dapat mengubah hasil test lokal.

## Browser E2E

Install Chromium sekali:

```powershell
cd frontend
npx playwright install chromium
```

Kemudian jalankan:

```powershell
npm run test:e2e
```

Playwright menjalankan database SQLite disposable dan server backend/frontend khusus
test. Suite ini dijalankan di CI, bukan pre-commit, karena membutuhkan browser dan
waktu startup lebih panjang.

## Seed akun Admin demo

Admin dibuat secara eksplisit dan idempotent; tidak ada password Admin di repository.

```powershell
cd backend
$env:ADMIN_EMAIL="admin@rangkul.id"
$env:ADMIN_PASSWORD="<password-kuat>"
$env:ADMIN_FULL_NAME="Admin Rangkul"
.\env\Scripts\python.exe -m app.scripts.seed_admin
```

Untuk backend Docker yang sedang berjalan:

```powershell
docker compose exec -e ADMIN_EMAIL=admin@rangkul.id -e ADMIN_PASSWORD="<password-kuat>" -e ADMIN_FULL_NAME="Admin Rangkul" backend python -m app.scripts.seed_admin
```

Masuk melalui `http://localhost:3000/admin/login`. Admin hanya dapat mengelola data eksternal di `/admin`; akses Person Profile keluarga selalu ditolak.
