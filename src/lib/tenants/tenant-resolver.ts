import { prisma } from "@/lib/prisma";
import { MARKETPLACE_TENANT_KEY, DEFAULT_TENANT_KEY } from "./constants";
import { computeCapabilities } from "./capability-policy";
import type { TenantCapabilities, TenantMode, TenantPlan } from "./capabilities";

export type ResolvedTenant = {
  tenant: { id: string; key: string; name?: string; mode?: string | null; plan?: string | null };
  capabilities: TenantCapabilities;
};

/**
 * Resolve tenant by key and attach capabilities.
 * Special-case MARKETPLACE to return a virtual tenant.
 */
export async function resolveTenantWithCapabilities(tenantKey: string): Promise<ResolvedTenant> {
  const key = String(tenantKey || "").trim() || DEFAULT_TENANT_KEY;

  if (key === MARKETPLACE_TENANT_KEY) {
    const virtual = { id: "marketplace", key: MARKETPLACE_TENANT_KEY, name: "Marketplace", mode: "MARKETPLACE", plan: null };
    const caps = computeCapabilities({ mode: "MARKETPLACE" as TenantMode, plan: "FREE" as TenantPlan });
    return { tenant: virtual, capabilities: caps as TenantCapabilities };
  }

  const t = await prisma.tenant.findUnique({ where: { key }, select: { id: true, key: true, name: true, mode: true, plan: true } });
  if (!t) throw new Error(`Tenant not found: ${key}`);

  const mode = (String(t.mode || "WHITE_LABEL") as TenantMode) || ("WHITE_LABEL" as TenantMode);
  const plan = (String(t.plan || "FREE") as TenantPlan) || ("FREE" as TenantPlan);
  const capabilities = computeCapabilities({ mode, plan });
  return { tenant: { id: t.id, key: t.key, name: t.name, mode, plan }, capabilities: capabilities as TenantCapabilities };
}

export default {} as const;
