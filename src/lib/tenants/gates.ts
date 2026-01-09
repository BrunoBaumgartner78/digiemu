import { redirect, notFound } from "next/navigation";
import type { TenantCapabilities } from "@/lib/tenants/capabilities";

type GateMode = "redirect" | "notFound";

export function requireCap(
  caps: TenantCapabilities,
  key: keyof TenantCapabilities,
  opts?: { mode?: GateMode; redirectTo?: string }
) {
  if (caps[key]) return;

  const mode = opts?.mode ?? "redirect";
  if (mode === "notFound") notFound();

  redirect(opts?.redirectTo ?? "/marketplace");
}

export function requireAll(
  caps: TenantCapabilities,
  keys: (keyof TenantCapabilities)[],
  opts?: { mode?: GateMode; redirectTo?: string }
) {
  const ok = keys.every((k) => Boolean(caps[k]));
  if (ok) return;

  const mode = opts?.mode ?? "redirect";
  if (mode === "notFound") notFound();

  redirect(opts?.redirectTo ?? "/marketplace");
}

export default {} as const;
