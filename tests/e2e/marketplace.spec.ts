import { test, expect } from "@playwright/test";

test("GET /marketplace -> 200", async ({ page }) => {
  const res = await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
  expect(res?.status(), "Expected /marketplace to be reachable").toBe(200);
});

test("GET /explore -> 200", async ({ page }) => {
  const res = await page.goto("/explore", { waitUntil: "domcontentloaded" });
  expect(res?.status(), "Expected /explore to be reachable").toBe(200);
});
