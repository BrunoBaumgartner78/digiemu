import React from "react";
import Link from "next/link";
import styles from "./publicProfile.module.css";
import { formatMoneyCents } from "@/lib/money";

export type PublicProduct = {
  id: string;
  title: string;
  priceCents: number | null;
  thumbnail: string | null;
};

type Props = {
  products: PublicProduct[];
  productBasePath?: string;
};

export default function ProductGrid({ products, productBasePath = "/product" }: Props) {
  return (
    <div className={styles["public-products"]}>
      <div className={styles["public-products__head"]}>
        <h3 className={styles["public-products__title"]}>Produkte</h3>
      </div>

      {products.length === 0 ? (
        <div className="neo-card" style={{ padding: 12 }}>Noch keine Produkte veröffentlicht.</div>
      ) : (
        <div className={styles["product-grid"]}>
          {products.map((p) => (
            <article key={p.id} className={styles["product-card"]}>
              {p.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbnail} alt={p.title} className={styles["product-thumb"]} />
              ) : (
                <div className={styles["product-thumb--fallback"]}>🎧</div>
              )}

              <div className={styles["product-body"]}>
                <h4 className={styles["product-title"]}>{p.title}</h4>
                <div className={styles["product-price"]}>{typeof p.priceCents === "number" ? formatMoneyCents(p.priceCents) : "—"}</div>

                <div className={styles["product-actions"]}>
                  <Link href={`${productBasePath}/${p.id}`} className={`neo-btn product-cta`}>
                    Zum Produkt
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
