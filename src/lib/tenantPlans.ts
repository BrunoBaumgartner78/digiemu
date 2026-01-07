// src/lib/tenantPlans.ts
// DigiEmu Tenant Plans: Limits + Feature Flags
// Drop-in helper for server routes + UI gating.

export type TenantPlan = "FREE" | "PRO" | "ENTERPRISE";

export type TenantFeatures = {
  /** allow setting logoUrl + themeJson (branding) */
  branding: boolean;
  /** allow removing DigiEmu branding in UI (pure white-label) */
  whiteLabel: boolean;
  /** allow multiple custom domains */
  multiDomain: boolean;
};

export type TenantLimits = {
  /** max domains mapped to this tenant (TenantDomain rows) */
  maxDomains: number;
  /** soft limits for later enforcement (optional) */
  maxVendors?: number;
  maxProducts?: number;
};

export type TenantPlanConfig = {
  plan: TenantPlan;
  label: string;
  limits: TenantLimits;
  features: TenantFeatures;
};

export const TENANT_PLANS: Record<TenantPlan, TenantPlanConfig> = {
  FREE: {
    plan: "FREE",
    label: "Free",
    limits: {
      maxDomains: 1,
      maxVendors: 1,
      maxProducts: 25,
    },
    features: {
      branding: false,
      whiteLabel: false,
      multiDomain: false,
    },
  },

  PRO: {
    plan: "PRO",
    label: "Pro",
    limits: {
      maxDomains: 5,
      maxVendors: 25,
      maxProducts: 1000,
    },
    features: {
      branding: true,
      whiteLabel: false,
      multiDomain: true,
    },
  },

  ENTERPRISE: {
    plan: "ENTERPRISE",
    label: "Enterprise",
    limits: {
      maxDomains: 50,
      maxVendors: 10_000,
      maxProducts: 1_000_000,
    },
    features: {
      branding: true,
      whiteLabel: true,
      multiDomain: true,
    },
  },
};

export function normalizeTenantPlan(input: unknown): TenantPlan {
  const s = String(input ?? "").toUpperCase().trim();
  if (s === "PRO") return "PRO";
  if (s === "ENTERPRISE") return "ENTERPRISE";
  return "FREE";
}

export function getTenantPlanConfig(plan: unknown): TenantPlanConfig {
  const p = normalizeTenantPlan(plan);
  return TENANT_PLANS[p];
}

export function canUseBranding(plan: unknown) {
  return getTenantPlanConfig(plan).features.branding;
}

export function maxDomainsFor(plan: unknown) {
  return getTenantPlanConfig(plan).limits.maxDomains;
}
