import React from "react";
import Link from "next/link";
import styles from "./product.module.css";
import BuyButton from "./BuyButton";
import { formatMoneyCents } from "@/lib/money";

type ProductWithVendor = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  thumbnail: string | null;
  isActive: boolean;
  vendor: { id: string; name?: string | null; vendorProfile?: { slug?: string | null; displayName?: string | null; avatarUrl?: string | null } | null };
};

export default function ProductDetail({ product }: { product: ProductWithVendor }) {
  return (
    <div className={styles["product-shell"]}>
      <div className={styles["product-wrap"]}>
        <div className={styles["product-hero"]}>
          <div className={styles["product-media"]}>
            {product.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.thumbnail} alt={product.title} className={styles["product-thumb"]} />
            ) : (
              <div className={styles["product-thumb"]} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>🎧</div>
            )}
          </div>

          <aside>
            <div className="neo-card">
              <div className={styles["product-info"]}>
                <div className={styles["vendor-strip"]}>
                  {product.vendor?.vendorProfile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.vendor.vendorProfile.avatarUrl} alt={product.vendor.vendorProfile.displayName || "Vendor"} className={styles["vendor-avatar"]} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 999, background: "rgba(0,0,0,0.06)" }} />
                  )}

                  <div>
                    {product.vendor.vendorProfile?.slug ? (
                      <Link href={`/profile/${encodeURIComponent(String(product.vendor.vendorProfile.slug))}`}>
                        <strong>{product.vendor.vendorProfile.displayName || product.vendor.name || "Verkäufer"}</strong>
                      </Link>
                    ) : (
                      <div><strong>{product.vendor.vendorProfile?.displayName || product.vendor.name || "Verkäufer"}</strong></div>
                    )}
                  </div>
                </div>

                <h1 className={styles["product-title"]}>{product.title}</h1>
                <div className={styles["product-price"]}>{formatMoneyCents(product.priceCents)}</div>

                <div className={styles["product-desc"]}>{product.description}</div>

                <div className={styles["neo-buy"]}>
                  <BuyButton productId={product.id} />
                </div>

                <div style={{ marginTop: 12 }}>
                  <Link href="/" className="neo-cta" style={{ background: "transparent", border: "1px solid rgba(0,0,0,.06)" }}>Zurück</Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
