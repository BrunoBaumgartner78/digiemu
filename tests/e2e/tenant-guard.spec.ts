import { test, expect } from "@playwright/test";

const TENANT_HOST = process.env.E2E_TENANT_HOST;
const BAD_HOST = process.env.E2E_BAD_HOST || "localhost";

// Choose a tenant-scoped path that definitely exists in src/app/(tenant)/
// If you're unsure, set E2E_TENANT_PATH; otherwise default to '/'
const TENANT_PATH = process.env.E2E_TENANT_PATH || "/";

test("tenant host mapped -> tenant route should be reachable (200)", async ({ request }) => {
  test.skip(!TENANT_HOST, "E2E_TENANT_HOST not set (set it to an existing mapped tenant domain in DB)");

  const res = await request.get(TENANT_PATH, {
    headers: {
      host: TENANT_HOST,
    },
  });

  // With correct tenant host mapping, this should be a real page
  expect(res.status()).toBe(200);
});

test("localhost (DEFAULT tenant) -> tenant route should be reachable (200)", async ({ request }) => {
  const res = await request.get(TENANT_PATH, {
    headers: { host: BAD_HOST },
  });

  // In this codebase, localhost resolves to DEFAULT tenant.
  expect(res.status()).toBe(200);
});

test("unknown host -> should not crash (not 500)", async ({ request }) => {
  const res = await request.get(TENANT_PATH, {
    headers: { host: "unknown.invalid" },
  });

  // Depending on your fallback rules, this can be 200 (DEFAULT fallback) or 404/redirect.
  // The invariant we want: never 500.
  expect(res.status()).not.toBe(500);
});
