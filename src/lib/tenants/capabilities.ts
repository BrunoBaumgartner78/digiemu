export type TenantMode = "WHITE_LABEL" | "MARKETPLACE";
export type TenantPlan = "FREE" | "PRO" | "ENTERPRISE";

export type TenantCapabilities = {
  // core
  whiteLabelStore: boolean;
  marketplaceBuy: boolean;
  publicProducts: boolean;

  // vendor / marketplace ops
  vendorSell: boolean;
  vendorApproval: boolean;

  // branding/domains
  branding: boolean;
  customDomain: boolean;
  analytics: boolean;

  // admin extras
  payouts: boolean;
};

export type ResolvedTenant = {
  key: string;
  mode: TenantMode;
  plan: TenantPlan;
  capabilities: TenantCapabilities;
};

export default {} as const;
