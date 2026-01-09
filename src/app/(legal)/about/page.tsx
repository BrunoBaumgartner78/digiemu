import Link from "next/link";
import styles from "../legalPage.module.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.kicker}>DIGIEMU · INFO</div>
          <h1 className={styles.title}>About us</h1>
          <p className={styles.subtitle}>
            DigiEmu ist ein digitaler Marktplatz für Creators – sicher kaufen, einfach verkaufen.
          </p>

          <div className={styles.pillRow}>
            <Link className={styles.pill} href="/marketplace">Marketplace</Link>
            <Link className={styles.pill} href="/preise">Preise</Link>
            <Link className={styles.pill} href="/help">Hilfe</Link>
          </div>

          <hr className={styles.hr} />

          <div className={styles.section}>
            <h2 className={styles.h2}>Mission</h2>
            <p className={styles.p}>
              Wir bauen eine Plattform, die den Verkauf digitaler Produkte unkompliziert macht – mit sauberem Checkout,
              schnellen Downloads und fairer Auszahlung.
            </p>

            <h2 className={styles.h2}>Werte</h2>
            <ul className={styles.list}>
              <li>Creator-first</li>
              <li>Stabilität & Sicherheit</li>
              <li>Klare Regeln & Transparenz</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
