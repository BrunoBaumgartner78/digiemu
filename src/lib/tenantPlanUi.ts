// src/lib/tenantPlanUi.ts
// UI-only labels for Prisma enum TenantPlan (FREE/PRO/ENTERPRISE).
// Keeps enums internal/English, while UI stays human-friendly.

export type TenantPlanKey = "FREE" | "PRO" | "ENTERPRISE";

// ✅ Intern bleibt TenantPlan = FREE | PRO | ENTERPRISE (Prisma Enum, Englisch)
// ✅ UI-Label: verständlich fürs Admin (Free / Pro / Business)
export const TENANT_PLAN_LABEL = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Business",
} as const;

// ✅ Shop/Betriebsmodus (independent from plan)
export const TENANT_MODE_LABEL = {
  WHITE_LABEL: "White-Label Shop (eigener Shop)",
  MARKETPLACE: "Content OS (Multi-Vendor 80/20)",
} as const;

export const TENANT_PLAN_HELP =
  "Hinweis: Content OS ist ein separater Modus (80/20) und nicht an diesen Plan gekoppelt.";

export const TENANT_PLAN_HINT: Record<TenantPlanKey, string> = {
  FREE: "Für kleine Shops / Tests. Branding + Domain-Mapping möglich.",
  PRO: "Für produktive White-Label Shops mit eigenem Branding.",
  ENTERPRISE: "Für Organisationen mit individuellen Anforderungen.",
};
