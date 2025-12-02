// src/components/marketplace/ProductCard.tsx
"use client";

import Link from "next/link";
import styles from "./ProductCard.module.css";

export type ProductLike = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  thumbnail: string | null;
};

type Props = {
  product: ProductLike;
};

export function ProductCard({ product }: Props) {
  const imageUrl = product.thumbnail || "/images/product-placeholder.png";
  const price = (product.priceCents ?? 0) / 100;

  return (
    <Link href={`/product/${product.id}`} className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        <img
          src={imageUrl}
          alt={product.title}
          className={styles.thumbnail}
        />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{product.title}</h3>
        {product.description && (
          <p className={styles.description}>
            {product.description.length > 80
              ? product.description.slice(0, 77) + "..."
              : product.description}
          </p>
        )}
        <div className={styles.footer}>
          <span className={styles.price}>{price.toFixed(2)} CHF</span>
        </div>
      </div>
    </Link>
  );
}
