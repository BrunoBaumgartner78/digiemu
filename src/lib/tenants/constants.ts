// Tenant constants and basic types (V1)

export const MARKETPLACE_TENANT_KEY = "MARKETPLACE";
export const DEFAULT_TENANT_KEY = "DEFAULT";

export type TenantMode = "WHITE_LABEL" | "MARKETPLACE";

export type TenantPlan = "FREE" | "PRO" | "ENTERPRISE";

// keep these simple and serializable
export type TenantSummary = {
  id: string;
  key: string;
  name?: string;
  mode?: TenantMode;
  plan?: TenantPlan | null;
};

export default {} as const;
