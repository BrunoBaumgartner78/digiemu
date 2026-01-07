// src/lib/tenantModeGuard.ts
import { NextResponse } from "next/server";

// Keep it simple: mode is stored as string in DB (or derived),
// so we accept string and normalize.
export type TenantMode = "WHITE_LABEL" | "MARKETPLACE";

export function normalizeTenantMode(mode: any): TenantMode {
  const m = String(mode || "").toUpperCase().trim();
  if (m === "WHITE_LABEL" || m === "MARKETPLACE") return m as TenantMode;
  // Backwards compatibility: map legacy variants to WHITE_LABEL
  if (m === "FREE_SHOP" || m === "PAID_SHOP" || m === "SINGLE_VENDOR" || m === "MULTI_VENDOR" || m === "MIXED" || m === "PAID_VENDOR") return "WHITE_LABEL";
  // default fallback: safest is WHITE_LABEL (most restrictive)
  return "WHITE_LABEL";
}

export function forbid(feature: string, mode: string) {
  return NextResponse.json(
    {
      ok: false,
      error: "TENANT_MODE_FORBIDDEN",
      message: `This action is disabled for this tenant (mode=${mode}). Feature: ${feature}`,
    },
    { status: 403 }
  );
}

export function requireModeOr403(args: {
  tenant: any; // expects tenant.mode somewhere
  allow: TenantMode[];
  feature: string;
}) {
  const mode = normalizeTenantMode(args.tenant?.mode);
  if (!args.allow.includes(mode)) return { ok: false as const, res: forbid(args.feature, mode), mode };
  return { ok: true as const, mode };
}
