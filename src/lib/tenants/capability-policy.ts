import type { TenantCapabilities, TenantMode, TenantPlan } from "./capabilities";

// Plan baseline (independent of mode)
function byPlan(plan: TenantPlan): Pick<TenantCapabilities, "branding" | "customDomain" | "analytics" | "payouts"> {
  switch (plan) {
    case "ENTERPRISE":
      return { branding: true, customDomain: true, analytics: true, payouts: true };
    case "PRO":
      return { branding: true, customDomain: true, analytics: true, payouts: true };
    case "FREE":
    default:
      return { branding: false, customDomain: false, analytics: false, payouts: false };
  }
}

// Mode overlay (business rules)
function byMode(mode: TenantMode): Pick<
  TenantCapabilities,
  "whiteLabelStore" | "marketplaceBuy" | "publicProducts" | "vendorSell" | "vendorApproval"
> {
  if (mode === "MARKETPLACE") {
    return {
      whiteLabelStore: false,
      marketplaceBuy: true,
      publicProducts: true,
      vendorSell: true,
      vendorApproval: true,
    };
  }

  // WHITE_LABEL
  return {
    whiteLabelStore: true,
    marketplaceBuy: false,
    publicProducts: true,
    vendorSell: false,
    vendorApproval: false,
  };
}

export function computeCapabilities(input: { plan: TenantPlan; mode: TenantMode }): TenantCapabilities {
  const p = byPlan(input.plan);
  const m = byMode(input.mode);

  return {
    ...m,
    ...p,
  } as TenantCapabilities;
}

export default {} as const;
