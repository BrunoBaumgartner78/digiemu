import Link from "next/link";
import styles from "./ProductCard.module.css";
import type { MarketplaceProduct } from "@/types/ui";

export default function ProductCard({ product }: { product: MarketplaceProduct }) {
  const title = product.title ?? "Untitled";
  const description = product.description ?? null;
  const thumb = product.thumbnail ?? null;
  const vendorName =
    product.vendorProfile?.displayName ||
    product.vendorProfile?.user?.name ||
    product.vendor?.name ||
    null;

  return (
    <article className={styles.card}>
      <div className={styles.inner}>
        <div className={styles.thumbWrap}>
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.thumb} src={thumb} alt={title} />
          ) : (
            <div className={styles.thumb} aria-hidden="true" />
          )}
        </div>

        <h3 className={styles.title}>{title}</h3>
        {vendorName ? <div className={styles.vendor}>{vendorName}</div> : null}

        {description ? <p className={styles.desc}>{description}</p> : null}

        <div className={styles.bottomRow}>
          <Link className={styles.cta} href={`/product/${product.id}`}>
            Details
          </Link>
          <div className={styles.price}>
            {typeof product.priceCents === "number"
              ? `${(product.priceCents / 100).toFixed(2)} CHF`
              : "Preis auf Anfrage"}
          </div>
        </div>
      </div>
    </article>
  );
}
