// src/app/(tenant)/vendors/[vendorProfileId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { vendorProfileId: string };

export default async function VendorPage(props: { params: Promise<Params> }) {
  const { vendorProfileId } = await props.params;
  const id = String(vendorProfileId || "").trim();
  if (!id) notFound();

  // Tenant muss hier gelten (white-label)
  const tenant = await currentTenant();

  // VendorProfile tenant-scoped
  const vendor = await prisma.vendorProfile.findFirst({
    where: {
      id,
      tenantKey: tenant.key,
      // optional: isPublic: true,
    },
  });

  if (!vendor) notFound();

  // Produkte tenant-scoped + Vendor
  // IMPORTANT:
  // - Do NOT use fields that aren't in your Prisma schema (e.g. publishedAt).
  // - If your Product model doesn't have "status", remove that filter.
  //   (Keeping this query schema-safe is more important for prod build.)
  const products = await prisma.product.findMany({
    where: {
      tenantKey: tenant.key,
      vendorProfileId: vendor.id,
      // If Product.status exists, you can re-enable this (use APPROVED/ACTIVE):
      // status: "APPROVED" as any,
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="text-xs text-[var(--text-muted)]">Vendor</div>
        <h1 className="text-2xl font-bold">{vendor.displayName ?? vendor.slug ?? "Vendor"}</h1>
        {vendor.bio ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{vendor.bio}</p>
        ) : null}
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <div className="neumorph-card p-5 text-sm text-[var(--text-muted)]">
            Keine veröffentlichten Produkte.
          </div>
        ) : (
          products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="neumorph-card p-5 hover:opacity-90 transition"
            >
              <div className="font-semibold">{p.title}</div>
              {p.description ? (
                <div className="mt-2 text-sm text-[var(--text-muted)] line-clamp-3">{p.description}</div>
              ) : null}
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
