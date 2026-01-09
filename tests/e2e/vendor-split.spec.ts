import { test, expect } from "@playwright/test";

const MARKETPLACE_HOST = process.env.E2E_MARKETPLACE_HOST || "mp-e2e.local";
const WHITE_LABEL_HOST = process.env.E2E_TENANT_HOST || "e2e.local";

test("global marketplace seller route should not 500 on nonsense id", async ({ request }) => {
  const res = await request.get("/seller/not-a-real-id", { headers: { host: `${MARKETPLACE_HOST}:3000` } });
  expect([404, 200, 302, 307]).toContain(res.status());
  expect(res.status()).not.toBe(500);
});

test("tenant vendor route should exist (404 ok) and not 500", async ({ request }) => {
  const res = await request.get("/vendors/not-a-real-id", { headers: { host: `${WHITE_LABEL_HOST}:3000` } });
  expect([404, 200, 302, 307]).toContain(res.status());
  expect(res.status()).not.toBe(500);
});
