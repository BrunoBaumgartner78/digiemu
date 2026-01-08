import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { MARKETPLACE_TENANT_KEY } from "@/lib/marketplaceTenant";
import { isPublicVendor } from "@/lib/vendors/visibility";
import { getSellerStats } from "@/lib/vendors/stats";

export const dynamic = "force-dynamic";

function fmtCHFfromCents(cents: number) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(
    (cents ?? 0) / 100
  );
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("de-CH").format(n ?? 0);
}

export default async function SellerPage(
  props: { params: Promise<{ vendorProfileId: string }> }
) {
  const { vendorProfileId } = await props.params;
  const id = String(vendorProfileId ?? "").trim();
  if (!id) notFound();
  let vp: any = null;
  try {
    // Load vendor profile by id (do not assume MARKETPLACE tenant here)
    vp = await prisma.vendorProfile.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        userId: true,
        tenantKey: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        isPublic: true,
        status: true,
        ratingAvg: true,
        ratingCount: true,
        totalSales: true,
        totalRevenueCents: true,
        refundsCount: true,
        activeProductsCount: true,
        lastSaleAt: true,
        user: { select: { name: true } },
      },
    });
  } catch (e: any) {
    console.error("[seller] TRANSIENT_ERROR", { vendorProfileId: id, message: e?.message ?? e });
    return (
      <main className="page-shell" style={{ paddingTop: 14 }}>
        <section className="neo-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 0.6, textTransform: "uppercase" }}>
            Verkäuferprofil
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 26, fontWeight: 950 }}>Temporär nicht verfügbar</h1>
          <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.7 }}>
            Bitte lade die Seite neu. Wenn es bleibt, ist die Datenbank gerade kurz beschäftigt.
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="neobtn" href="/marketplace">← Marketplace</Link>
          </div>
        </section>
      </main>
    );
  }

  // If this vendor profile has a public slug, redirect to canonical profile path
  if (vp && typeof vp.slug === "string" && vp.slug.trim().length > 0) {
    return redirect(`/profile/${encodeURIComponent(vp.slug)}`);
  }

  // Marketplace seller page must only surface public, approved vendor profiles
  if (!vp || String(vp.status || "").toUpperCase() !== "APPROVED" || !Boolean(vp.isPublic)) notFound();

  const vendorName = vp.displayName ?? vp.user?.name ?? "Verkäufer";

  // Aggregate stable stats from products + orders (reduces reliance on cached fields)
  const [stats, lastSale] = await Promise.all([
    getSellerStats({ tenantKey: vp.tenantKey ?? MARKETPLACE_TENANT_KEY, vendorProfileId: vp.id }),
    prisma.order.findFirst({
      where: { status: "PAID", product: { vendorId: vp.userId } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const salesCount = stats.totalSales;
  const revenueCents = stats.totalRevenueCents;
  const activeProducts = stats.activeProducts;
  const lastSaleAt = lastSale?.createdAt ?? null;
  const lastSaleLabel = lastSaleAt
    ? new Intl.DateTimeFormat("de-CH", { dateStyle: "medium" }).format(lastSaleAt)
    : "—";

  // Use vendorProfile tenantKey to find products that belong to the same scope
  // Product.status is a string in the schema; use ACTIVE for marketplace-visible items.
  const products = await prisma.product.findMany({
    where: {
      tenantKey: vp.tenantKey,
      vendorProfileId: vp.id,
      isActive: true,
      status: { in: ["ACTIVE"] },
      vendor: { isBlocked: false },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      thumbnail: true,
      category: true,
      vendorId: true,
    },
    take: 24,
  });

  return (
    <main className="page-shell" style={{ paddingTop: 14 }}>
      {/* HERO (Banner) */}
      <section className="neo-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ position: "relative", height: 260 }}>
          {vp.bannerUrl ? (
            <Image src={vp.bannerUrl} alt="" fill priority style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", opacity: 0.14 }} />
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        </div>

        {/* Profile Card */}
        <div style={{ padding: 18 }}>
          <div
            className="neo-card"
            style={{
              padding: 18,
              display: "flex",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: 999,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                flex: "0 0 auto",
              }}
            >
              {vp.avatarUrl ? (
                <Image src={vp.avatarUrl} alt="" width={86} height={86} style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", opacity: 0.18 }} />
              )}
            </div>

            {/* Name + Bio + Actions */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: 0.6, textTransform: "uppercase" }}>
                Verkäuferprofil
              </div>
              <div style={{ fontSize: 34, fontWeight: 950, lineHeight: 1.1 }}>{vendorName}</div>
              {vp.bio ? (
                <div style={{ marginTop: 6, opacity: 0.84, lineHeight: 1.6, maxWidth: 860 }}>{vp.bio}</div>
              ) : null}

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="neobtn neobtn-ghost" href="/marketplace">← Marketplace</Link>
                <Link className="neobtn neobtn-ghost" href="/help">Hilfe</Link>
              </div>
            </div>

            {/* Right stats */}
            <div style={{ marginLeft: "auto", display: "grid", gap: 10, minWidth: 280 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 10 }}>
                <div className="neo-card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Verkäufe</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 950 }}>{fmtNum(salesCount)}</div>
                </div>

                <div className="neo-card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Umsatz</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 950 }}>{fmtCHFfromCents(revenueCents)}</div>
                </div>

                <div className="neo-card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Aktive Produkte</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 950 }}>{fmtNum(activeProducts ?? products.length)}</div>
                </div>

                <div className="neo-card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Letzter Verkauf</div>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 850 }}>{lastSaleLabel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>Produkte</h2>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{fmtNum(products.length)} verfügbar</div>
        </div>

        {products.length === 0 ? (
          <div className="neo-card" style={{ marginTop: 12, padding: 16, opacity: 0.85 }}>Keine aktiven Produkte gefunden.</div>
        ) : (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={typeof p.priceCents === "number" ? p.priceCents / 100 : 0}
                imageUrl={p.thumbnail && p.thumbnail.length > 0 ? p.thumbnail : `/api/media/thumbnail/${encodeURIComponent(p.id)}?variant=blur`}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
