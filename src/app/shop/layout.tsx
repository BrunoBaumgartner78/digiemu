import React from "react";
import { notFound } from "next/navigation";
import { currentTenant } from "@/lib/tenant-context";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Resolve tenant from host / context
  const tenant = await currentTenant();
  if (!tenant?.key) notFound();

  // Derive capabilities (single source of truth)
  try {
    const { capabilities } = await resolveTenantWithCapabilities(tenant.key);
    if (!capabilities.whiteLabelStore) {
      // Not allowed to view WL-only area
      notFound();
    }
  } catch (err) {
    notFound();
  }

  return (
    <>
      <head>
        <meta name="x-tenant-key" content={tenant.key} />
      </head>
      {children}
    </>
  );
}
