// src/lib/tenants/home.ts
import { normalizeTenantMode } from "@/lib/tenantMode";
import { prisma } from "@/lib/prisma";

function isSafeInternalPath(p: unknown): p is string {
  if (typeof p !== "string") return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("//")) return false;
  if (p.includes("://")) return false;
  return true;
}

export async function resolveTenantHomePath(tenantKey: string) {
  // Fetch tenant row for themeJson + mode
  const t = await prisma.tenant.findUnique({ where: { key: tenantKey }, select: { mode: true, themeJson: true } });
  const modeRaw = (t?.mode as unknown) ?? "WHITE_LABEL";
  const mode = normalizeTenantMode(modeRaw);

  const homePath = (t?.themeJson && typeof t.themeJson === "object" ? (t.themeJson as any).homePath : undefined) as unknown;
  if (isSafeInternalPath(homePath)) return { mode, homePath };

  if (mode === "MARKETPLACE") return { mode, homePath: "/marketplace" };
  return { mode, homePath: "/shop" };
}

export default {} as const;
