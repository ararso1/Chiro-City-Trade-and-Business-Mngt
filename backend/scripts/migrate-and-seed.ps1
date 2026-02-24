# Run this after setting your PostgreSQL password in .env
# Usage: .\scripts\migrate-and-seed.ps1
# Or from backend: npx prisma migrate dev --name init; npx prisma db seed

$ErrorActionPreference = "Stop"
$backendRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $backendRoot "package.json"))) {
  $backendRoot = Join-Path (Get-Location) "backend"
}
Set-Location $backendRoot
Write-Host "Running migrations..."
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Seeding demo data and users..."
npx prisma db seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done. Start backend with: npm run start:dev"
