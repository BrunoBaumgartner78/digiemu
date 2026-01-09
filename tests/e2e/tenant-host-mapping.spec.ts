import { test, expect } from "@playwright/test";

const TENANT_PATH = process.env.E2E_TENANT_PATH || "/shop";
const TENANT_HOST = process.env.E2E_TENANT_HOST;

test("tenant host mapping: localhost vs mapped host differ", async ({ request }) => {
  // 1) DEFAULT (localhost)
  const resDefault = await request.get(TENANT_PATH, { headers: { host: "localhost:3000" } });
  expect(resDefault.status()).toBe(200);
  const htmlDefault = await resDefault.text();
  const mDefault = htmlDefault.match(/<meta name="x-tenant-key" content="([^"]+)"/);
  expect(mDefault).toBeTruthy();

  // 2) Mapped tenant host (requires E2E_TENANT_HOST env to be set)
  test.skip(!TENANT_HOST, "E2E_TENANT_HOST not set (skipping mapped host assertion)");

  const resMapped = await request.get(TENANT_PATH, { headers: { host: `${TENANT_HOST}:3000` } });
  expect(resMapped.status()).toBe(200);
  const htmlMapped = await resMapped.text();
  const mMapped = htmlMapped.match(/<meta name="x-tenant-key" content="([^"]+)"/);
  expect(mMapped).toBeTruthy();

  const keyDefault = mDefault?.[1];
  const keyMapped = mMapped?.[1];

  // They must differ (DEFAULT vs e2e tenant key)
  expect(keyMapped).not.toBe(keyDefault);
});
