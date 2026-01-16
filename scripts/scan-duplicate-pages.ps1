$ErrorActionPreference = "Stop"
$pages = Get-ChildItem -Recurse "src\app" -Filter "page.tsx" | Select-Object -ExpandProperty FullName
$norm = @{}

function Normalize([string]$p) {
  $p = $p -replace '\\','/'
  $p = $p -replace '^.*?/src/app/',''
  # remove route groups like (public) or (app)
  $p = $p -replace '/\([^)]+\)',''
  return $p.ToLower()
}

foreach ($p in $pages) {
  $n = Normalize $p
  if (-not $norm.ContainsKey($n)) { $norm[$n] = @() }
  $norm[$n] += $p
}

$dups = $norm.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
if (-not $dups) {
  Write-Host "OK: no duplicate routes detected."
  exit 0
}

Write-Host "DUPLICATE ROUTES FOUND:"
foreach ($d in $dups) {
  Write-Host ""
  Write-Host "RouteKey:" $d.Key
  $d.Value | ForEach-Object { Write-Host " - " $_ }
}
exit 1
