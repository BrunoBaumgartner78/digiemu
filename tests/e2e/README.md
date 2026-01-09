# DigiEmu Mini E2E

## Run
- Start dev server: `npm run dev`
- Run tests: `npm run test:e2e`

## Optional env
- `PW_BASE_URL` (default http://localhost:3000)
- `E2E_WL_HOST` (e.g. tenant domain host header, if needed)
- `E2E_ADMIN_DOMAIN_ADD_ENDPOINT` (optional)

## Tenant host mapping (deterministic tests)
These tests require a real mapped domain from your DB (tenant.domains).

Set:
- `E2E_TENANT_HOST=blue-lotos.ch` (example, must exist in DB)
- optional: `E2E_TENANT_PATH=/` or another path under src/app/(tenant)

Run:
- `PW_BASE_URL=http://localhost:3000 E2E_TENANT_HOST=... npm run test:e2e`
