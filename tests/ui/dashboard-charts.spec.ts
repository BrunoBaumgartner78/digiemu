import { test, expect } from "@playwright/test";

test("dashboard renders earnings bars + top products section", async ({ page }) => {
  // Voraussetzung: Test-Login ist bei dir bereits gelöst (cookie / storageState / dev bypass)
  await page.goto("/dashboard?range=30");

  const bars = page.locator('[data-testid="earnings-bars"] > div');
  await expect(bars).toHaveCountGreaterThan(10);

  // Mindestens ein Bar muss sichtbare Höhe haben (> 2px)
  const hasVisible = await bars.evaluateAll((els) => {
    return els.some((el) => {
      const h = parseFloat(getComputedStyle(el).height || "0");
      return h > 2;
    });
  });
  expect(hasVisible).toBeTruthy();

  // Top products card exists
  await expect(page.getByTestId("top-products-bars").or(page.getByText(/Noch keine Verkäufe/i))).toBeVisible();
});
