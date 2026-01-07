$ErrorActionPreference = "Stop"

Write-Host "== Routes present (folders) =="
Get-ChildItem -Directory src/app | Select-Object Name | Sort-Object Name

Write-Host "`n== Scan marketplace/product/explore for tenant scoping (NO regex) =="
$files = Get-ChildItem -Recurse -File src/app/marketplace,src/app/product,src/app/explore -ErrorAction SilentlyContinue
$needles = @(
  "currentTenant(",
  "MARKETPLACE_TENANT_KEY",
  "tenantKey",
  "getMarketplaceProducts",
  "prisma.product.findMany",
  "prisma.product.findUnique"
)

foreach ($n in $needles) {
  Write-Host "`n--- needle: $n ---"
  $hits = $files | Select-String -SimpleMatch $n -ErrorAction SilentlyContinue
  if ($hits) {
    $hits | Select-Object Path, LineNumber, Line
  } else {
    Write-Host "no hits"
  }
}

Write-Host "`n== Scan for forbidden literal route-pattern hrefs =="
Get-ChildItem -Recurse -File src |
  Select-String -SimpleMatch 'href="/admin/tenants/[id]"','href={"/admin/tenants/[id]"}','/admin/tenants/[id]' -ErrorAction SilentlyContinue |
  Select-Object Path, LineNumber, Line

Write-Host "`nDone."
