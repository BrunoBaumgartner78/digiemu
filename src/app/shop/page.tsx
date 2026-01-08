// src/app/shop/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import styles from "./ShopPage.module.css";
import { cookies } from "next/headers";
import { currentTenant } from "@/lib/tenant-context";
import { resolveLandingConfig } from "@/lib/tenants/shell";
import { normalizeTenantMode } from "@/lib/tenantMode";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { notFound } from "next/navigation";

export default async function ShopPage() {
  cookies(); // ✅ MUSS im Function Body sein

  const ct = await currentTenant();
  // If no tenant found, fall back to global marketplace listing
  if (!ct) {
    notFound();
  }

  // Resolve full tenant row (mode may be stored in DB row)
  let tenantRow: any = null;
  try {
    const resolved = await resolveTenantWithCapabilities(ct.key);
    tenantRow = resolved.tenant;
  } catch (e) {
    tenantRow = { key: ct.key, name: ct.name };
  }

  const mode = normalizeTenantMode(tenantRow?.mode ?? "WHITE_LABEL");
  const cfg = resolveLandingConfig(tenantRow as any);

  // If this tenant requested a GRID landing and is not the marketplace, render tenant-scoped grid
  if (mode !== "MARKETPLACE" && cfg.landingVariant === "GRID") {
    // Featured first
    let featured: any[] = [];
    if (cfg.featuredProductIds && cfg.featuredProductIds.length > 0) {
      featured = await prisma.product.findMany({
        where: { id: { in: cfg.featuredProductIds }, tenantKey: tenantRow.key },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, description: true, priceCents: true, thumbnail: true, category: true },
      });
    }

    const excludeIds = featured.map((p) => p.id);
    const rest = await prisma.product.findMany({
      where: { tenantKey: tenantRow.key, id: { notIn: excludeIds } as any },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: { id: true, title: true, description: true, priceCents: true, thumbnail: true, category: true },
    });

    const products = [...featured, ...rest];

    const title = cfg.title ?? tenantRow.name ?? ct.name ?? "Shop";
    const subtitle = cfg.subtitle ?? undefined;

    return (
      <main className={styles.page} data-landing-variant={cfg.landingVariant}>
        <head>
          <meta name="x-landing-variant" content={cfg.landingVariant} />
        </head>

        <section className={styles.inner}>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </header>

          <section className={styles.grid}>
            {products.length === 0 && (
              <div className={styles.emptyState}>Noch keine Produkte im Shop.</div>
            )}

            {products.map((product) => {
              const priceCHF = typeof product.priceCents === "number" ? (product.priceCents / 100).toFixed(2) : "0.00";

              return (
                <article key={product.id} className={styles.card}>
                  <div className={styles.thumbWrapper}>
                    {product.thumbnail ? (
                      <Image src={product.thumbnail} alt={product.title} fill className={styles.thumbImage} />
                    ) : (
                      <div className={styles.thumbPlaceholder}>Kein Vorschaubild</div>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <span className={styles.categoryChip}>{product.category || "uncategorized"}</span>
                    <h2>{product.title}</h2>
                    <p>{product.description}</p>
                  </div>

                  <footer className={styles.cardFooter}>
                    <span>CHF {priceCHF}</span>
                    <Link href={`/product/${product.id}`}>Details</Link>
                  </footer>
                </article>
              );
            })}
          </section>
        </section>
      </main>
    );
  }

  // Fallback / global marketplace listing
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      thumbnail: true,
      category: true,
      vendor: {
        select: { name: true },
      },
    },
  });

  return (
    <main className={styles.page}>
      <section className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Shop</h1>
          <p className={styles.subtitle}>
            Entdecke digitale Produkte von unabhängigen Creators.
          </p>
        </header>

        <section className={styles.grid}>
          {products.length === 0 && (
            <div className={styles.emptyState}>
              Noch keine Produkte im Shop.
            </div>
          )}

          {products.map((product) => {
            const priceCHF =
              typeof product.priceCents === "number"
                ? (product.priceCents / 100).toFixed(2)
                : "0.00";

            return (
              <article key={product.id} className={styles.card}>
                <div className={styles.thumbWrapper}>
                  {product.thumbnail ? (
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      className={styles.thumbImage}
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder}>
                      Kein Vorschaubild
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <span className={styles.categoryChip}>
                    {product.category || "uncategorized"}
                  </span>
                  <h2>{product.title}</h2>
                  <p>{product.description}</p>
                </div>

                <footer className={styles.cardFooter}>
                  <span>CHF {priceCHF}</span>
                  <Link href={`/product/${product.id}`}>Details</Link>
                </footer>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
