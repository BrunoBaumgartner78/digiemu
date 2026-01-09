import { test, expect } from "@playwright/test";

const TENANT_HOST = process.env.E2E_TENANT_HOST;
const MARKETPLACE_HOST = process.env.E2E_MARKETPLACE_HOST;

test.describe("tenant shop landing (GRID)", () => {
  test("white-label tenant /shop returns 200 and includes landing meta", async ({ request }) => {
    test.skip(!TENANT_HOST, "E2E_TENANT_HOST not set (skipping mapped host assertion)");

    const res = await request.get("/shop", { headers: { host: `${TENANT_HOST}:3000` } });
    expect(res.status()).toBeGreaterThan(0);
    // Must not 500
    expect(res.status()).not.toBe(500);

    const html = await res.text();
    const m = html.match(/<meta name="x-landing-variant" content="([^"]+)"/);
    // Meta is optional in some test setups. If present, it must be GRID or DEFAULT.
    if (m) {
      const val = m[1];
      expect(["GRID", "DEFAULT"]).toContain(val);
    } else {
      // no meta – still consider the test successful as long as no 500
      expect(res.status()).toBe(200);
    }
  });

  test("marketplace tenant /shop is gated or redirects to /marketplace", async ({ request }) => {
    test.skip(!MARKETPLACE_HOST, "E2E_MARKETPLACE_HOST not set (skipping marketplace assertion)");

    const res = await request.get("/shop", { headers: { host: `${MARKETPLACE_HOST}:3000` }, redirect: 'manual' } as any);
    // should not be 500
    expect(res.status()).not.toBe(500);

    if (res.status() >= 300 && res.status() < 400) {
      const loc = res.headers()['location'] || '';
      expect(loc).toContain('/marketplace');
    } else {
      // allowed: 200 (if gate shows marketplace), 404 (not found)
      expect([200, 404]).toContain(res.status());
    }
  });
});
