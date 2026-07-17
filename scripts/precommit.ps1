[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$isWindowsPlatform = $PSVersionTable.PSEdition -eq "Desktop" -or $env:OS -eq "Windows_NT"
$pythonCandidates = if ($isWindowsPlatform) {
    @(
        (Join-Path $backendDir "env\Scripts\python.exe"),
        (Join-Path $backendDir ".venv\Scripts\python.exe")
    )
}
else {
    @(
        (Join-Path $backendDir "env/bin/python"),
        (Join-Path $backendDir ".venv/bin/python")
    )
}
$backendPython = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
$npmCommand = if ($isWindowsPlatform) { "npm.cmd" } else { "npm" }

function Invoke-Gate {
    param(
        [Parameter(Mandatory)]
        [string]$Name,
        [Parameter(Mandatory)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory)]
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    Push-Location $WorkingDirectory
    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            throw "$Name gagal dengan exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

if (-not $backendPython) {
    Write-Error @"
Virtual environment backend tidak ditemukan pada env atau .venv.

Buat environment dan install dependency:
  cd backend
  python -m venv env
  .\env\Scripts\python.exe -m pip install -r requirements-dev.txt
"@
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendDir "node_modules"))) {
    Write-Error @"
Dependency frontend belum terpasang.
Jalankan:
  cd frontend
  npm ci
"@
}

Write-Host "Menjalankan quality gate sebelum commit..." -ForegroundColor Yellow

Invoke-Gate -Name "Backend lint (Ruff)" -WorkingDirectory $backendDir -Command {
    & $backendPython -m ruff check .
}

Invoke-Gate -Name "Backend tests (pytest)" -WorkingDirectory $backendDir -Command {
    $testEnvironment = @{
        DEBUG = "False"
        DATABASE_URL = "sqlite:///./test_rangkul.db"
        JWT_SECRET_KEY = "test-secret-key-with-at-least-thirty-two-characters"
        COOKIE_SECURE = "False"
        COOKIE_SAMESITE = "lax"
    }
    $originalEnvironment = @{}

    try {
        foreach ($entry in $testEnvironment.GetEnumerator()) {
            $originalEnvironment[$entry.Key] = [Environment]::GetEnvironmentVariable(
                $entry.Key,
                [EnvironmentVariableTarget]::Process
            )
            [Environment]::SetEnvironmentVariable(
                $entry.Key,
                $entry.Value,
                [EnvironmentVariableTarget]::Process
            )
        }
        & $backendPython -m pytest -q
    }
    finally {
        foreach ($entry in $originalEnvironment.GetEnumerator()) {
            [Environment]::SetEnvironmentVariable(
                $entry.Key,
                $entry.Value,
                [EnvironmentVariableTarget]::Process
            )
        }
    }
}

Invoke-Gate -Name "Frontend lint (ESLint)" -WorkingDirectory $frontendDir -Command {
    & $npmCommand run lint
}

Invoke-Gate -Name "Frontend tests (Vitest)" -WorkingDirectory $frontendDir -Command {
    & $npmCommand test -- --run
}

Write-Host ""
Write-Host "Semua lint dan test lulus. Commit diizinkan." -ForegroundColor Green
