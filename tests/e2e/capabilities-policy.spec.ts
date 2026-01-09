import { test, expect } from "@playwright/test";
import { computeCapabilities } from "../../src/lib/tenants/capability-policy";

test("capabilities: FREE white-label disables branding+domains", async () => {
  const c = computeCapabilities({ plan: "FREE", mode: "WHITE_LABEL" });
  expect(c.branding).toBe(false);
  expect(c.customDomain).toBe(false);
  expect(c.whiteLabelStore).toBe(true);
  expect(c.marketplaceBuy).toBe(false);
});

test("capabilities: PRO marketplace enables vendorSell+approval", async () => {
  const c = computeCapabilities({ plan: "PRO", mode: "MARKETPLACE" });
  expect(c.vendorSell).toBe(true);
  expect(c.vendorApproval).toBe(true);
  expect(c.marketplaceBuy).toBe(true);
  expect(c.whiteLabelStore).toBe(false);
});
