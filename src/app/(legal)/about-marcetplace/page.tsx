import Link from "next/link";
import styles from "../legalPage.module.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.kicker}>DIGIEMU · INFO</div>
          <h1 className={styles.title}>About marketplace</h1>
          <p className={styles.subtitle}>Kurz erklärt, wie DigiEmu funktioniert – für Käufer:innen und Verkäufer:innen.</p>

          <div className={styles.pillRow}>
            <Link className={styles.pill} href="/marketplace">Marketplace</Link>
            <Link className={styles.pill} href="/preise">Preise</Link>
            <Link className={styles.pill} href="/help">Hilfe</Link>
          </div>

          <hr className={styles.hr} />

          <div className={styles.section}>
            <h2 className={styles.h2}>Ablauf</h2>
            <ul className={styles.list}>
              <li>Creators erstellen Produkte (Datei, Preis, Beschreibung, Thumbnail).</li>
              <li>Käufer:innen kaufen per Checkout.</li>
              <li>Nach Zahlung: Download im Account, ggf. mit Ablauf/Limit.</li>
            </ul>

            <h2 className={styles.h2}>Sicherheit</h2>
            <p className={styles.p}>
              Downloads sind an Bestellungen gebunden. Missbrauch (z. B. Weitergabe) kann limitiert werden.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
