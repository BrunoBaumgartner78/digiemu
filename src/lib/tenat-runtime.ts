import { headers } from "next/headers";
import { getTenantByDomain } from "@/lib/tenants";

export async function resolveTenantKey(fallback = "bellu") {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost")
    .split(":")[0]
    .toLowerCase();

  return getTenantByDomain(host)?.key ?? fallback;
}
