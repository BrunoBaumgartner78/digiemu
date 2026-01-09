import type { TenantPlan } from "@prisma/client";

export function tenantPlanLabel(plan: TenantPlan): string {
  switch (plan) {
    case "FREE":
      return "Community";
    case "PRO":
      return "Pro (White-Label)";
    case "ENTERPRISE":
      return "Enterprise (Business)";
    default:
      return plan;
  }
}

export function tenantPlanHint(): string {
  return "Hinweis: Content OS ist ein separater Modus (80/20) und hat keinen Tenant-Plan.";
}
