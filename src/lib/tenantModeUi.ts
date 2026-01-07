// src/lib/tenantModeUi.ts
// UI labels for internal enum (English) -> DE Admin UI
export const TENANT_MODE_LABEL = {
  WHITE_LABEL: "White-Label Shop",
  MARKETPLACE: "Marketplace (Multi-Vendor)",
} as const;

export function tenantModeBadge(mode: string) {
  const m = (mode || "").toUpperCase();
  if (m === "MULTIVENDOR") return "bg-emerald-500/10 text-emerald-300";
  if (m === "PAID_VENDOR") return "bg-fuchsia-500/10 text-fuchsia-300";
  if (m === "MIXED") return "bg-cyan-500/10 text-cyan-300";
  return "bg-slate-500/10 text-slate-300"; // FREE_SHOP / fallback
}

// Short helper hints for each mode shown in the admin UI
export const TENANT_MODE_HINT = {
  WHITE_LABEL: "White-Label Shop — eigener Shop, keine Multi-Vendor-Funktionen.",
  MARKETPLACE: "Marktplatz mit mehreren Verkäufern und Monetarisierung.",
} as const;
