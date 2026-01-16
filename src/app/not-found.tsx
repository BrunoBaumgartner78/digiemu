// src/app/not-found.tsx
import Link from "next/link";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <main className={styles.neo404}>
      <section className={styles.neoCard}>
        <div className={styles.neoTop}>
          <span className={styles.neoBadge}>404</span>
          <span className={styles.neoStatus}>Seite nicht gefunden</span>
        </div>

        <h1 className={styles.neoTitle}>
          Diese Seite gibt’s hier <span className={styles.neoAccent}>nicht</span>.
        </h1>

        <p className={styles.neoText}>
          Vielleicht ein alter Link oder ein Tippfehler. Du kannst direkt zurück zum Marketplace
          oder zur Startseite.
        </p>

        <div className={styles.neoActions}>
          <Link className={`${styles.neoBtn} ${styles.neoPrimary}`} href="/marketplace">
            Zum Marketplace
          </Link>
          <Link className={styles.neoBtn} href="/">
            Startseite
          </Link>
          <Link className={`${styles.neoBtn} ${styles.neoGhost}`} href="/pricing">
            Preise
          </Link>
        </div>

        <div className={styles.neoHint}>
          Tipp: Wenn du von <code>/preise</code> kommst, nutze <code>/pricing</code>.
        </div>
      </section>
    </main>
  );
}
