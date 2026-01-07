import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { requireCap } from "@/lib/tenants/gates";
import { isPublicVendor } from "@/lib/vendors/visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { vendorProfileId: string };

export default async function TenantVendorPublicPage(props: { params: Promise<Params> }) {
  const { vendorProfileId } = await props.params;
  const id = String(vendorProfileId || "").trim();
  if (!id) notFound();

  const ct = await currentTenant();
  const { tenant, capabilities } = await resolveTenantWithCapabilities(ct.tenantKey || ct.key);
  requireCap(capabilities, "publicProducts", { mode: "notFound" });

  const vendor = await prisma.vendorProfile.findFirst({ where: { id, tenantKey: tenant.key } });

  if (!vendor || !isPublicVendor(vendor)) notFound();

  const products = await prisma.product.findMany({
    where: {
      tenantKey: tenant.key,
      vendorProfileId: vendor.id,
      status: "PUBLISHED" as any,
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <div className="text-xs text-[var(--text-muted)]">Vendor</div>
        <h1 className="text-2xl font-bold">{vendor.displayName || "Vendor"}</h1>
        {vendor.bio ? <p className="mt-2 text-[var(--text-muted)]">{vendor.bio}</p> : null}
      </header>

      {products.length === 0 ? (
        <div className="neumorph-card p-6">
          <div className="text-sm text-[var(--text-muted)]">Noch keine veröffentlichten Produkte.</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="neumorph-card p-4 block hover:translate-y-[-1px] transition"
            >
              <div className="font-semibold">{p.title}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {typeof p.price === "number" ? `${(p.price / 100).toFixed(2)} CHF` : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
