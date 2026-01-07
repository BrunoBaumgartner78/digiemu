import { notFound } from "next/navigation";
import { currentTenant } from "@/lib/tenant-context";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await currentTenant();

  // defensiv
  if (!tenant?.key) notFound();

  const { capabilities } = await resolveTenantWithCapabilities(tenant.key);

  // ✅ White-Label only
  if (!capabilities.whiteLabelStore) notFound();
  return (
    <>
      <head>
        <meta name="x-tenant-key" content={tenant.key} />
      </head>
      {children}
    </>
  );
}
