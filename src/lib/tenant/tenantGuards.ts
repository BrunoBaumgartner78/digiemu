export const TENANT_MODE_ALLOWED = ["WHITE_LABEL", "MARKETPLACE"] as const;
export type TenantModeAllowed = (typeof TENANT_MODE_ALLOWED)[number];

export const TENANT_PLAN_ALLOWED = ["FREE", "PRO", "ENTERPRISE"] as const;
export type TenantPlanAllowed = (typeof TENANT_PLAN_ALLOWED)[number];

export function normalizeEnum(v: unknown): string {
  return String(v ?? "").trim().toUpperCase();
}

export function parseTenantMode(v: unknown): TenantModeAllowed | null {
  const s = normalizeEnum(v);
  if ((TENANT_MODE_ALLOWED as readonly string[]).includes(s)) return s as TenantModeAllowed;
  return null;
}

export function parseTenantPlan(v: unknown): TenantPlanAllowed | null {
  const s = normalizeEnum(v);
  if ((TENANT_PLAN_ALLOWED as readonly string[]).includes(s)) return s as TenantPlanAllowed;
  return null;
}
