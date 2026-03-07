import React from "react";
import Link from "next/link";
import styles from "./publicProfile.module.css";
import { formatMoneyCents } from "@/lib/money";
import SafeImg from "@/components/ui/SafeImg";

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
        <div className="neo-card" style={{ padding: 12 }}>
          Noch keine Produkte veröffentlicht.
        </div>
      ) : (
        <div className={styles["product-grid"]}>
          {products.map((p) => (
            <article key={p.id} className={styles["product-card"]}>
              <div className={styles["product-thumbWrap"]}>
                <SafeImg
                  src={p.thumbnail}
                  alt={p.title}
                  className={styles["product-thumb"]}
                  fallback={<div className={styles["product-thumb--fallback"]}>🎧</div>}
                  sizes="(max-width: 720px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div className={styles["product-body"]}>
                <h4 className={styles["product-title"]}>{p.title}</h4>
                <div className={styles["product-price"]}>
                  {typeof p.priceCents === "number" ? formatMoneyCents(p.priceCents) : "—"}
                </div>

                <div className={styles["product-actions"]}>
                  <Link href={`${productBasePath}/${p.id}`} className="neobtn">
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
