import Link from "next/link";
import styles from "../legalPage.module.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.kicker}>DIGIEMU · INFO</div>
          <h1 className={styles.title}>Kontakt</h1>
          <p className={styles.subtitle}>Schreib uns – wir antworten so schnell wie möglich.</p>

          <div className={styles.pillRow}>
            <Link className={styles.pill} href="/marketplace">Marketplace</Link>
            <Link className={styles.pill} href="/preise">Preise</Link>
            <Link className={styles.pill} href="/help">Hilfe</Link>
          </div>

          <hr className={styles.hr} />

          <div className={styles.section}>
            <h2 className={styles.h2}>Support</h2>
            <p className={styles.p}>
              <a href="mailto:support@digiemu.ch">support@digiemu.ch</a>
            </p>

            <h2 className={styles.h2}>Partnerschaften / Creators</h2>
            <p className={styles.p}>
              <a href="mailto:partners@digiemu.ch">partners@digiemu.ch</a>
            </p>

            <p className={styles.muted}>
              Tipp: Bitte Order-ID / Produkt-ID mitschicken, dann geht’s schneller.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
