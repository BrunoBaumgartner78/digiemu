import { test, expect } from "@playwright/test";

function e2eHeaders() {
  const secret = process.env.E2E_ADMIN_SECRET;
  const email = process.env.E2E_ADMIN_EMAIL || "admin@bellu.ch";
  if (!secret) throw new Error("Missing E2E_ADMIN_SECRET");
  return {
    "x-e2e-admin": "1",
    "x-e2e-secret": secret,
    "x-e2e-email": email,
    "content-type": "application/json",
  };
}

test("admin: tenants/update returns 303 (E2E header auth)", async ({ request }) => {
  const tenantId = process.env.E2E_TENANT_ID;
  test.skip(!tenantId, "Missing E2E_TENANT_ID");

  const res = await request.post("/api/admin/tenants/update", {
    headers: e2eHeaders(),
    data: { tenantId, name: "E2E-Admin-Test" },
  });

  expect(res.status()).toBe(303);
});

test("admin: tenants/domain/add returns 303 (E2E header auth)", async ({ request }) => {
  const tenantId = process.env.E2E_TENANT_ID;
  test.skip(!tenantId, "Missing E2E_TENANT_ID");

  const res = await request.post("/api/admin/tenants/domain/add", {
    headers: e2eHeaders(),
    data: { tenantId, domain: "e2e-test.local", makePrimary: false },
  });

  // you redirect back to tenant page
  expect(res.status()).toBe(303);
});
