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
