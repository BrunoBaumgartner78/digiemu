import { currentTenant } from "@/lib/tenant-context";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { requireCap } from "@/lib/tenants/gates";
import SellClient from "@/components/sell/SellClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SellPage() {
  const ct = await currentTenant();
  const { tenant, capabilities } = await resolveTenantWithCapabilities(ct.tenantKey || ct.key);

  // Require vendorSell capability for tenant-scoped sell/onboard flow
  requireCap(capabilities, "vendorSell", { mode: "notFound" });

  return <SellClient />;
}
