import Link from "next/link";
import styles from "../legalPage.module.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.kicker}>DIGIEMU · RECHTLICHES</div>
          <h1 className={styles.title}>Allgemeine Geschäfts- Bedingungen (AGB)</h1>
          <p className={styles.subtitle}>
            Stand: {new Date().toLocaleDateString("de-CH")} · Platzhaltertext – bitte juristisch prüfen lassen.
          </p>

          <div className={styles.pillRow}>
            <Link className={styles.pill} href="/marketplace">Marketplace</Link>
            <Link className={styles.pill} href="/preise">Preise</Link>
            <Link className={styles.pill} href="/help">Hilfe</Link>
          </div>

          <hr className={styles.hr} />

          <div className={styles.section}>
            <h2 className={styles.h2}>1. Geltungsbereich</h2>
            <p className={styles.p}>
              Diese AGB regeln die Nutzung des Marktplatzes DigiEmu für Käufer:innen und Verkäufer:innen.
            </p>

            <h2 className={styles.h2}>2. Leistungen</h2>
            <p className={styles.p}>
              DigiEmu stellt die Plattform bereit. Inhalte werden von Verkäufer:innen bereitgestellt, sofern nicht anders angegeben.
            </p>

            <h2 className={styles.h2}>3. Konto & Sicherheit</h2>
            <ul className={styles.list}>
              <li>Käufe, Downloads und Dashboard erfordern ein Konto.</li>
              <li>Du bist für die Sicherheit deiner Zugangsdaten verantwortlich.</li>
              <li>Missbrauch kann zur Sperrung führen.</li>
            </ul>

            <h2 className={styles.h2}>4. Download & digitale Inhalte</h2>
            <p className={styles.p}>
              Nach erfolgreicher Zahlung wird ein Download bereitgestellt. Downloads können zeitlich/anzahlmäßig limitiert sein.
            </p>

            <h2 className={styles.h2}>5. Widerruf / Rückerstattung</h2>
            <p className={styles.p}>
              Bei digitalen Inhalten kann das Widerrufsrecht erlöschen, sobald der Download begonnen hat (je nach Rechtslage).
            </p>

            <p className={styles.muted}>
              Hinweis: Bitte Inhalte/Regeln, Gebührenmodell, Verantwortlichkeiten und Gerichtsstand sauber ausformulieren.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
