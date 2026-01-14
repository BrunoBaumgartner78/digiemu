param(
  [string]$BaseUrl = "http://localhost:3000"
)

function Read-ErrorBody([System.Exception]$ex) {
  $resp = $ex.Response
  if (-not $resp) { return @{ status = -1; body = $ex.Message } }

  try { $status = [int]$resp.StatusCode } catch { $status = -1 }

  $body = ""
  try {
    $stream = $resp.GetResponseStream()
    if ($stream) { $reader = New-Object System.IO.StreamReader($stream); $body = $reader.ReadToEnd() }
  } catch { $body = "" }

  return @{ status = $status; body = $body }
}

function Call-Endpoint([string]$method, [string]$url, $jsonBody = $null) {
  Write-Host ""; Write-Host "==> $method $url"
  try {
    if ($null -ne $jsonBody) {
      $res = Invoke-WebRequest -Method $method -Uri $url -ContentType "application/json" -Body $jsonBody -UseBasicParsing
    } else {
      $res = Invoke-WebRequest -Method $method -Uri $url -UseBasicParsing
    }
    Write-Host ("STATUS: {0}" -f $res.StatusCode)
    if ($res.Content) { Write-Host $res.Content }
    return @{ status = [int]$res.StatusCode; body = $res.Content }
  } catch {
    $info = Read-ErrorBody $_.Exception
    Write-Host ("STATUS: {0}" -f $info.status)
    if ($info.body) { Write-Host $info.body }
    return $info
  }
}

# GET profile-status (should be 401 when not logged-in)
$getUrl = "$BaseUrl/api/vendor/profile-status"
$r1 = Call-Endpoint "GET" $getUrl

# POST products/create (should be 401 when not logged-in)
$postUrl = "$BaseUrl/api/products/create"
$payload = @{ title = "Smoke Test"; priceCents = 1000 } | ConvertTo-Json
$r2 = Call-Endpoint "POST" $postUrl $payload

Write-Host ""; Write-Host "==> SUMMARY"
Write-Host ("GET  /api/vendor/profile-status : {0}" -f $r1.status)
Write-Host ("POST /api/products/create      : {0}" -f $r2.status)

# Exit code: 0 if both are 401; otherwise 1
if ($r1.status -eq 401 -and $r2.status -eq 401) { exit 0 } else { exit 1 }
