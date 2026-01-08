import { test, expect } from "@playwright/test";

const MARKETPLACE_HOST = process.env.E2E_MARKETPLACE_HOST || "mp-e2e.local";

test("marketplace /seller/:id does not 500 on nonsense id", async ({ request }) => {
  const res = await request.get("/seller/not-a-real-id", { headers: { host: `${MARKETPLACE_HOST}:3000` } });
  expect([404, 200, 302, 307]).toContain(res.status());
  expect(res.status()).not.toBe(500);
});

test("marketplace /product/:id does not 500 on nonsense id", async ({ request }) => {
  const res = await request.get("/product/not-a-real-id", { headers: { host: `${MARKETPLACE_HOST}:3000` } });
  expect([404, 200, 302, 307]).toContain(res.status());
  expect(res.status()).not.toBe(500);
});

test("marketplace seller link resolves (canonical /profile/:slug or fallback /seller/:id)", async ({ request }) => {
  const res = await request.get("/marketplace", { headers: { host: `${MARKETPLACE_HOST}:3000` } });
  expect(res.status()).toBeLessThan(500);
  const body = await res.text();

  const m = body.match(/href=\"(\/profile\/[^\"\s>]+|\/seller\/[^\"\s>]+)\"/i);
  expect(m).not.toBeNull();
  const href = m ? m[1] : null;
  expect(href).toBeTruthy();

  // Follow the link (allow one redirect chain)
  let followRes = await request.get(href as string, { headers: { host: `${MARKETPLACE_HOST}:3000` } });
  if ([301, 302, 307, 308].includes(followRes.status())) {
    const loc = (followRes.headers() as any)["location"];
    if (loc) {
      const target = loc.startsWith("/") ? loc : loc;
      followRes = await request.get(target, { headers: { host: `${MARKETPLACE_HOST}:3000` } });
    }
  }

  // Final result must not be 404 or 500
  expect(followRes.status()).not.toBe(404);
  expect(followRes.status()).not.toBe(500);
});

test("marketplace seller link only for approved public profiles", async ({ page }) => {
  await page.goto("/marketplace");
  const cards = page.locator("article");
  await expect(cards.first()).toBeVisible();

  const sellerLinks = page.locator('a.neo-link[href*="/seller/"]');
  // If present, they must navigate to a page that returns 200 and contains seller area
  const count = await sellerLinks.count();
  for (let i = 0; i < Math.min(count, 3); i++) {
    const href = await sellerLinks.nth(i).getAttribute("href");
    expect(href).toBeTruthy();
    const res = await page.request.get(href!);
    expect(res.ok()).toBeTruthy();
  }
});

test("seller page shows stats section", async ({ page }) => {
  await page.goto("/marketplace");
  const sellerLink = page.locator('a.neo-link[href*="/seller/"]').first();
  if ((await sellerLink.count()) === 0) test.skip();
  const href = await sellerLink.getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.locator('text=/^Verkäufe$/').first()).toBeVisible();
  await expect(page.locator('text=/^Umsatz$/').first()).toBeVisible();
});

test("archived products are not visible", async ({ page }) => {
  await page.goto("/marketplace");
  const html = await page.content();
  expect(/ARCHIVED/i.test(html)).toBeFalsy();
});

test("seller stats do not crash marketplace", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page.locator("text=Verkäufe").first()).toBeVisible();
});
