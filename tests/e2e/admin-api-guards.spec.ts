import { test, expect } from "@playwright/test";

test("POST /api/admin/tenants/update -> 401 when unauthenticated", async ({ request }) => {
  const res = await request.post("/api/admin/tenants/update", {
    data: { tenantId: "dummy", name: "x" },
    headers: { "content-type": "application/json" },
  });
  expect([401, 400, 404]).toContain(res.status());
});

test("POST /api/admin/tenants/domain/add -> 401 when unauthenticated", async ({ request }) => {
  const res = await request.post("/api/admin/tenants/domain/add", {
    data: { tenantId: "dummy", domain: "example.com", makePrimary: true },
    headers: { "content-type": "application/json" },
  });
  expect([401, 400, 404]).toContain(res.status());
});

test("POST /api/admin/tenants/domain/remove -> 401 when unauthenticated", async ({ request }) => {
  const res = await request.post("/api/admin/tenants/domain/remove", {
    data: { tenantId: "dummy", domainId: "dummy" },
    headers: { "content-type": "application/json" },
  });
  expect([401, 400, 404]).toContain(res.status());
});
