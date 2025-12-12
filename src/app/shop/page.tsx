// src/app/shop/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import styles from "./ShopPage.module.css";

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      thumbnail: true,
      category: true,
      vendor: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <main className={styles.page}>
      <section className={styles.inner}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Shop</h1>
            <p className={styles.subtitle}>
              Entdecke digitale Produkte von unabhängigen Creators – sofort
              downloadbar nach dem Kauf.
            </p>
          </div>
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
                  <div className={styles.categoryRow}>
                    <span className={styles.categoryChip}>
                      {product.category || "uncategorized"}
                    </span>
                    {product.vendor?.name && (
                      <span className={styles.vendorName}>
                        {product.vendor.name}
                      </span>
                    )}
                  </div>

                  <h2 className={styles.productTitle}>{product.title}</h2>
                  <p className={styles.productDescription}>
                    {product.description || "Keine Beschreibung hinterlegt."}
                  </p>
                </div>

                <footer className={styles.cardFooter}>
                  <div className={styles.priceBlock}>
                    <span className={styles.price}>
                      CHF {priceCHF}
                    </span>
                    <span className={styles.priceHint}>
                      Einmal zahlen · sofort laden
                    </span>
                  </div>

                  <Link
                    href={`/product/${product.id}`}
                    className={styles.detailsBtn}
                  >
                    Details
                  </Link>
                </footer>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
