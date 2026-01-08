# DigiEmu — Beta 1.0 Prod-Checklist (Build + E2E)

Diese Checkliste ist dafür da, dass du **sicher** bist: “Prod funktioniert”.

## 0) Voraussetzungen
- Node / npm installiert
- `.env.local` existiert
- DB erreichbar (Neon/PG)
- (Optional) E2E Admin Bypass: `E2E_ADMIN_SECRET` gesetzt

## 1) Standard (CI / macOS / Linux)
```bash
npm ci
npm run build
npm run test:e2e:prod
```

Erwartung:
- `npm run build` ✅
- `test:e2e:prod` ✅ (Playwright startet `next start` automatisch via webServer)

## 2) Windows “EPERM Prisma” — sicherer Ablauf
**Wichtig:** `next dev` vorher beenden.

```powershell
npm run prisma:generate:win
npm run build:prod:win
npm run test:e2e:prod:win
```

Wenn du nur “schnell grün” willst:
```powershell
npm run build:prod:win
```

## 3) Häufige Fehler & Fixes

### A) Prisma EPERM rename query_engine-windows.dll.node
Symptome:
- `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp...`

Fix:
```powershell
npm run prisma:generate:win
```
(Script killt node/prisma Prozesse und räumt `node_modules/.prisma` + `@prisma/client` auf.)

### B) Playwright ECONNREFUSED (127.0.0.1:3000 oder ::1:3000)
Ursache:
- Webserver läuft nicht oder Playwright trifft IPv6 `::1`

Fix:
- Wir verwenden IPv4 BaseURL in `playwright.config.ts`: `http://127.0.0.1:3000`
- Falls du manuell testest:
```powershell
$env:PW_BASE_URL="http://127.0.0.1:3000"
npx playwright test
```

### C) Tenant Host Mapping Tests / Marketplace Host
Manche Specs erwarten Hosts.

Setze in PowerShell vor `npm run test:e2e`:
```powershell
$env:E2E_TENANT_HOST="e2e.local"
$env:E2E_MARKETPLACE_HOST="mp-e2e.local"
```

Hinweis:
- Host muss in deiner DB als TenantDomain existieren und Primary/Mapping korrekt sein.
- Wenn du Marketplace manuell angelegt hast: setze `E2E_MARKETPLACE_HOST` genau darauf.

### D) Admin API E2E bypass (wenn kein Email/Pass Login)
In `.env.local`:
```env
E2E_ADMIN_SECRET=super-long-random-secret
E2E_ADMIN_EMAIL=admin@bellu.ch
E2E_TENANT_ID=<dein-tenant-id>
```

Beispiel-POST:
```powershell
'{"tenantId":"<id>","name":"E2E-Admin-Test"}' | Out-File -Encoding utf8 .\tmp.json
curl.exe -i -X POST "http://localhost:3000/api/admin/tenants/update" `
  -H "x-e2e-admin: 1" `
  -H "x-e2e-secret: super-long-random-secret" `
  -H "x-e2e-email: admin@bellu.ch" `
  -H "Content-Type: application/json" `
  --data-binary "@tmp.json"
```

Erwartung:
- 303 Redirect zurück auf `/admin/tenants/<id>` (oder 200/JSON je nach Handler)

## Playwright: Dev vs Prod (quick)
- Dev-mode (no build): `npm run test:e2e:dev` — starts `next dev` and runs Playwright against it.
- Prod-mode (build+start): `npm run test:e2e` — runs `npm run build` then starts server and runs Playwright.
- Override base URL: set `PW_BASE_URL` to change the URL Playwright targets (default `http://127.0.0.1:3000`).

### E2E
- Dev (ohne Build): `npm run test:e2e:dev`
- Prod (mit Build): `npm run test:e2e` (alias `test:e2e:prod`)
- Prod only (setzt vorhandenen Build voraus): `npm run test:e2e:prod:only`

## 4) “Ready to deploy” Definition (Beta 1.0)
✅ Mindestkriterien:
- `npm run build` (oder `build:prod:win` auf Windows) ist grün
- `npm run test:e2e:prod` (oder `test:e2e:prod:win`) ist grün
- Tenant preflight ist grün: `npm run tenant:preflight`
- Marketplace + White-Label Routing: /marketplace, /shop, /vendors/* laufen (404 ok, aber nicht 500)

## 5) Deploy-Runbook (Vercel)
  - /marketplace
  - /explore
  - /admin/tenants (als Admin)

## 6) Smoke nach Deploy (ohne Playwright)
```powershell
$env:SMOKE_BASE_URL="https://<dein-vercel-url>"
$env:SMOKE_WHITE_LABEL_HOST="e2e.local"
$env:SMOKE_MARKETPLACE_HOST="mp-e2e.local"
npm run smoke:prod
```
