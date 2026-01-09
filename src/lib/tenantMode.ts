export const TENANT_MODE = {
  WHITE_LABEL: "WHITE_LABEL",
  MARKETPLACE: "MARKETPLACE",
} as const;

export type TenantMode = (typeof TENANT_MODE)[keyof typeof TENANT_MODE];

export function normalizeTenantMode(input: unknown): TenantMode {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "WHITE_LABEL") return "WHITE_LABEL";
  if (v === "MARKETPLACE") return "MARKETPLACE";
  // Backward-compat (map legacy values)
  if (v === "SINGLE_VENDOR" || v === "MULTI_VENDOR" || v === "PAID_SHOP" || v === "FREE_SHOP") return "WHITE_LABEL";
  throw new Error(`Invalid tenant mode: ${String(input)}`);
}
