import { TenantMode, TenantPlan } from "./constants";

export type TenantCapabilities = {
  whiteLabelStore: boolean;
  marketplaceBuy: boolean;
  marketplaceSell: boolean;
  publicProducts: boolean;
  customDomain: boolean;
  analytics: boolean;
  branding: boolean;
};

// Base defaults by mode
export const baseByMode: Record<TenantMode, TenantCapabilities> = {
  MARKETPLACE: {
    whiteLabelStore: false,
    marketplaceBuy: true,
    marketplaceSell: false,
    publicProducts: true,
    customDomain: false,
    analytics: false,
    branding: false,
  },
  WHITE_LABEL: {
    whiteLabelStore: true,
    marketplaceBuy: false,
    marketplaceSell: false,
    publicProducts: true,
    customDomain: true,
    analytics: false,
    branding: false,
  },
};

// Plan overrides
export const planOverrides: Record<Exclude<TenantPlan, never>, Partial<TenantCapabilities>> = {
  FREE: { customDomain: false, analytics: false, branding: false },
  PRO: { customDomain: true, analytics: false, branding: true },
  ENTERPRISE: { customDomain: true, analytics: true, branding: true },
};

export function getTenantCapabilities(opts: { mode?: TenantMode | string; plan?: TenantPlan | string | null }): TenantCapabilities {
  const mode = (String(opts.mode || "WHITE_LABEL") as TenantMode) || ("WHITE_LABEL" as TenantMode);
  const plan = (opts.plan ?? "FREE") as TenantPlan | null;

  const base = baseByMode[mode] ?? baseByMode.WHITE_LABEL;
  // clone
  const out: TenantCapabilities = { ...base };

  if (plan && planOverrides[plan as TenantPlan]) {
    Object.assign(out, planOverrides[plan as TenantPlan]);
  }

  return out;
}

export default {} as const;
