[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
    & git config core.hooksPath .githooks
    if ($LASTEXITCODE -ne 0) {
        throw "Gagal mengatur core.hooksPath."
    }

    $configuredPath = (& git config --get core.hooksPath).Trim()
    if ($configuredPath -ne ".githooks") {
        throw "core.hooksPath tidak terpasang dengan benar: $configuredPath"
    }
}
finally {
    Pop-Location
}

Write-Host "Git hooks aktif dari .githooks." -ForegroundColor Green
Write-Host "Setiap commit sekarang wajib melewati seluruh lint dan test."
