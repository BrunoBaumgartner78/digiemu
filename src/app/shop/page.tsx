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
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { notFound } from "next/navigation";
import { requireCap } from "@/lib/tenants/gates";

export default async function ShopPage() {
  cookies(); // ✅ MUSS im Function Body sein

  // Guard: only accessible if tenant has whiteLabelStore capability
  const ct = await currentTenant();
  try {
    const resolved = await resolveTenantWithCapabilities(ct.key);
    requireCap(resolved.capabilities, "whiteLabelStore", { mode: "notFound" });
  } catch (err) {
    // if resolver fails, hide the page
    notFound();
  }

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
