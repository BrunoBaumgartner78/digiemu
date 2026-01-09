// src/lib/tenant-context.ts
import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type CurrentTenant = {
  id: string;
  key: string; // "DEFAULT", "blue-lotos", ...
  tenantKey: string; // duplicate for compatibility, always present
  name: string;
  host: string; // normalized host
};

/**
 * Normalize a host string by removing the "www." prefix and the port part.
 *
 * @example
 * normalizeHost("www.example.com:8080") // "example.com"
 */
function normalizeHost(host: string): string {
  const h = (host || "").toLowerCase().trim();
  const noPort = h.split(":")[0] ?? h;
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

async function getDefaultTenant() {
  // Use a raw query to avoid Prisma enum parsing errors when the DB
  // contains legacy enum values not present in the current Prisma schema.
  // We only need id/key/name here.
  const rows: Array<{ id: string; key: string; name: string } & Record<string, any>> =
    // parameterized query - safe
    await prisma.$queryRaw`SELECT id, key, name FROM "Tenant" WHERE key = ${"DEFAULT"} LIMIT 1`;

  const t = rows && rows[0];
  if (!t) throw new Error("DEFAULT tenant missing. Run seed.");
  // ✅ Defensive: ensure mode is always a valid current value
  const { normalizeTenantMode } = await import("@/lib/tenantMode");
  const safeMode = normalizeTenantMode((t as any).mode ?? "WHITE_LABEL");
  return { id: t.id, key: t.key, name: t.name, tenantKey: t.key, mode: safeMode } as any;
}

/**
 * Resolve the current tenant from the request Host header.
 * - localhost => DEFAULT (dev)
 * - otherwise: TenantDomain.domain -> Tenant
 * - fallback: DEFAULT
 */
// ✅ Require tenantKey synchron from Request headers (API routes)
// - keeps API routes simple
// - defaults to DEFAULT if host cannot be mapped
export async function requireTenant(req?: Request) {
  // Server-side only. If req is passed we can use host header, otherwise fall back to currentTenant().
  // Keep it simple: reuse currentTenant() logic (which already resolves by domain + DEFAULT fallback).
  const t = await currentTenant();
  if (!t?.key) throw new Error("Tenant missing");

  // Try to fetch full tenant row for richer runtime flags (catalogMode, payments, vendorOnboarding, etc.)
  const full = await prisma.tenant.findUnique({ where: { key: t.key } });
  if (full) return { tenantKey: t.key, tenant: full };

  // Fallback minimal tenant object (keeps compatibility)
  return {
    tenantKey: t.key,
    tenant: { key: t.key, host: t.host, catalogMode: "MIXED", payments: "ON", vendorOnboarding: "OPEN_WITH_APPROVAL" } as any,
  };
}

export async function currentTenant(): Promise<CurrentTenant> {
  // Next 15/16: headers() can behave async-ish depending on runtime,
  // so awaiting is safe.
  const h = await headers();
  const hostHeader = h.get("host") || "localhost:3000";
  const host = normalizeHost(hostHeader);

  // localhost → DEFAULT (für dev)
  if (host === "localhost") {
    const t = await getDefaultTenant();
    return { ...t, host };
  }

  const mapping = await prisma.tenantDomain.findUnique({
    where: { domain: host },
    include: { tenant: true },
  });

  if (mapping?.tenant) {
    return {
      id: mapping.tenant.id,
      key: mapping.tenant.key,
      tenantKey: mapping.tenant.key,
      name: mapping.tenant.name,
      host,
    };
  }

  const t = await getDefaultTenant();
  return { ...t, host };
}
