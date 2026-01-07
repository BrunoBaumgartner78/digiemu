import { test, expect } from "@playwright/test";

const SHOP_PATH = "/shop";
const SELL_PATH = "/sell";

const WHITE_LABEL_HOST = process.env.E2E_TENANT_HOST || "e2e.local";
const MARKETPLACE_HOST = process.env.E2E_MARKETPLACE_HOST || "mp-e2e.local";

test("DEFAULT (localhost) shop is reachable (200)", async ({ request }) => {
  const res = await request.get(SHOP_PATH, { headers: { host: "localhost:3000" } });
  expect([200, 302, 307]).toContain(res.status());
});

test("White-label tenant shop is reachable (200)", async ({ request }) => {
  const res = await request.get(SHOP_PATH, { headers: { host: `${WHITE_LABEL_HOST}:3000` } });
  expect(res.status()).toBe(200);
});

test("Marketplace tenant shop is blocked (404 or redirects to /marketplace)", async ({ request }) => {
  const res = await request.get(SHOP_PATH, { headers: { host: `${MARKETPLACE_HOST}:3000` } });

  // Depending on implementation: notFound() => 404, or redirect() => 302/303/307
  expect([404, 302, 303, 307]).toContain(res.status());

  if (res.status() !== 404) {
    const loc = res.headers()["location"] || "";
    expect(loc).toContain("/marketplace");
  }
});

test("SELL is gated depending on caps (should not 500)", async ({ request }) => {
  const res = await request.get(SELL_PATH, { headers: { host: `${WHITE_LABEL_HOST}:3000` } });
  expect(res.status()).not.toBe(500);
});
