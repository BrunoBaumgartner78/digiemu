"use client";
import styles from "./ProductCard.module.css";

export default function ProductCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={styles.cardBody}>
        <div className={styles.cardImagePlaceholder}>
          <div className={styles.skelImage} />
        </div>

        <div style={{ padding: "12px 0 0 0" }}>
          <div className={styles.skelTitle} />
          <div className={styles.skelDesc} />
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.skelButton} />
        <div className={styles.skelPrice} />
      </div>
    </article>
  );
}
