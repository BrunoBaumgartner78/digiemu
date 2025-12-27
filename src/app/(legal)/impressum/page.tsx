import Link from "next/link";
import styles from "../legalPage.module.css";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.kicker}>DIGIEMU · RECHTLICHES</div>
          <h1 className={styles.title}>Impressum</h1>
          <p className={styles.subtitle}>
            Stand: {new Date().toLocaleDateString("de-CH")} · Baumgartner Web Design & Develompmet
          </p>

          <div className={styles.pillRow}>
            <Link className={styles.pill} href="/marketplace">Marketplace</Link>
            <Link className={styles.pill} href="/preise">Preise</Link>
            <Link className={styles.pill} href="/help">Hilfe</Link>
          </div>

          <hr className={styles.hr} />

          <div className={styles.section}>
            <h2 className={styles.h2}>Betreiber</h2>
            <p className={styles.p}>
              DigiEmu (Baumgartner Web Design & Develompmet)<br />
              Le pré-aux-Boufes 222<br />
              2615 Sonvilier, Schweiz
            </p>

            <h2 className={styles.h2}>Kontakt</h2>
            <p className={styles.p}>
              E-Mail: <a href="mailto:support@bellu.ch">support@bellu.ch</a>
            </p>

            <h2 className={styles.h2}>Haftung</h2>
            <p className={styles.p}>
              Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für externe Links. Für Inhalte verlinkter Seiten sind
              deren Betreiber verantwortlich.
            </p>

            <p className={styles.muted}>
              Optional: UID/MWST/Handelsregister, verantwortliche Person, Hosting-Infos.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
