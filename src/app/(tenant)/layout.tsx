import { notFound } from "next/navigation";
import { currentTenant } from "@/lib/tenant-context";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { prisma } from "@/lib/prisma";
import { resolveShellConfig } from "@/lib/tenants/shell";
import { MainHeader } from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";

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
  // Load tenant row to access themeJson + logoUrl
  const full = await prisma.tenant.findUnique({ where: { key: tenant.key }, select: { logoUrl: true, themeJson: true, name: true } });
  const shellConfig = resolveShellConfig(full ?? null);

  return (
    <>
      <head>
        <meta name="x-tenant-key" content={tenant.key} />
      </head>

      <MainHeader
        variant={shellConfig.headerVariant}
        tenantBrand={{ name: full?.name ?? undefined, logoUrl: full?.logoUrl ?? null }}
      />

      <main>{children}</main>

      <MainFooter variant={shellConfig.footerVariant} />
    </>
  );
}
