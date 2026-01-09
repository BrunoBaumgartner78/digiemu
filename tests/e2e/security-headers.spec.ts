import { test, expect } from '@playwright/test';

test.describe('security headers', () => {
  test('CSP frame-ancestors present on /shop', async ({ request }) => {
    const resp = await request.get('/shop');
    expect(resp.status()).toBeGreaterThan(0);
    const csp = resp.headers()['content-security-policy'] || '';
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('X-Frame-Options present on /marketplace', async ({ request }) => {
    const resp = await request.get('/marketplace');
    expect(resp.status()).toBeGreaterThan(0);
    const xfo = resp.headers()['x-frame-options'] || '';
    expect(xfo.toUpperCase()).toBe('DENY');
  });
});
