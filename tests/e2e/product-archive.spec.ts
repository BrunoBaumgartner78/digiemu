import { test, expect } from "@playwright/test";

test("archived products are not visible in marketplace", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page.locator("text=ARCHIVED")).toHaveCount(0);
});
