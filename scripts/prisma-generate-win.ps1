# Windows-safe Prisma generate to avoid EPERM rename locks.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prisma-generate-win.ps1
$ErrorActionPreference = "SilentlyContinue"

# Kill processes that often lock Prisma engines
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process prisma -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove generated engine/client dirs that can be locked
if (Test-Path "node_modules\.prisma") { Remove-Item -Recurse -Force "node_modules\.prisma" }
if (Test-Path "node_modules\@prisma\client") { Remove-Item -Recurse -Force "node_modules\@prisma\client" }

# Re-generate
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "✅ Prisma generate done (win-safe)."
