import { test, expect } from '@playwright/test';

const TENANT_HOST = process.env.E2E_TENANT_HOST || 'e2e.local';

test.describe('tenant shell variants (minimal)', () => {
  test('white-label tenant host shows minimal header', async ({ request }) => {
    const resp = await request.get('/shop', { headers: { host: `${TENANT_HOST}:3000` } });
    expect(resp.status()).toBeGreaterThan(0);
    const html = await resp.text();

    // If the mapped host resolves to the marketplace tenant, skip strict checks
    const tenantMeta = html.match(/<meta name="x-tenant-key" content="([^"]+)"/);
    if (tenantMeta && tenantMeta[1] === 'marketplace') {
      test.skip(true, 'Mapped host resolves to marketplace; skipping white-label assertions');
    }

    // Minimal header should include Login/Register when white-label
    expect(html).toContain('Login');
    expect(html).toContain('Register');

    // Should not contain marketing links when white-label
    expect(html).not.toContain('/marketplace');
    // Conservative check: not showing literal DigiEmu marketing label
    expect(html).not.toContain('DigiEmu');
  });
});
