import Link from "next/link";
import styles from "../legalPage.module.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.kicker}>DIGIEMU · RECHTLICHES</div>
          <h1 className={styles.title}>Datenschutz- Erklärung</h1>
          <p className={styles.subtitle}>
            Stand: {new Date().toLocaleDateString("de-CH")} · Platzhalter (revDSG/DSGVO prüfen).
          </p>

          <div className={styles.pillRow}>
            <Link className={styles.pill} href="/marketplace">Marketplace</Link>
            <Link className={styles.pill} href="/preise">Preise</Link>
            <Link className={styles.pill} href="/help">Hilfe</Link>
          </div>

          <hr className={styles.hr} />

          <div className={styles.section}>
            <h2 className={styles.h2}>Welche Daten</h2>
            <ul className={styles.list}>
              <li>Accountdaten (E-Mail, Name optional)</li>
              <li>Transaktionsdaten (Bestellungen, Downloads)</li>
              <li>Technische Logs (IP, User-Agent) zur Sicherheit</li>
            </ul>

            <h2 className={styles.h2}>Zwecke</h2>
            <ul className={styles.list}>
              <li>Login, Marketplace, Dashboard</li>
              <li>Zahlungsabwicklung & Betrugsprävention</li>
              <li>Bereitstellung von Downloads & Support</li>
            </ul>

            <h2 className={styles.h2}>Drittanbieter</h2>
            <p className={styles.p}>
              Zahlungen können über Stripe erfolgen. Dateien können über Cloud-Speicher (z. B. Firebase Storage) ausgeliefert werden.
            </p>

            <h2 className={styles.h2}>Kontakt</h2>
            <p className={styles.p}>
              Datenschutz-Anfragen: <a href="mailto:support@bellu.ch">support@bellu.ch</a>
            </p>

            <p className={styles.muted}>
              Platzhaltertext – bitte echte Details ergänzen (Cookies/Analytics, Aufbewahrung, Rechte, Verantwortlicher).
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
