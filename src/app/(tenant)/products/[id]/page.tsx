import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { requireCap } from "@/lib/tenants/gates";
import { isPublishedProduct } from "@/lib/products/visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { id: string };

export default async function TenantProductDetailPage(props: { params: Promise<Params> }) {
  const { id } = await props.params;
  const productId = String(id || "").trim();
  if (!productId) notFound();

  const ct = await currentTenant();
  const { tenant, capabilities } = await resolveTenantWithCapabilities(ct.tenantKey || ct.key);
  requireCap(capabilities, "publicProducts", { mode: "notFound" });

  const product = await prisma.product.findFirst({ where: { id: productId, tenantKey: tenant.key } });

  if (!product || !isPublishedProduct(product)) notFound();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <div className="mt-3 text-sm text-[var(--text-muted)]">{product.description || ""}</div>
    </main>
  );
}
