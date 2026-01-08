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
