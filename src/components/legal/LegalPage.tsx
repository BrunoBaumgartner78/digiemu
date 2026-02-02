import Link from "next/link";
import styles from "./LegalPage.module.css";

type Props = {
  title: string;
  subtitle?: string;
  updatedAt?: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, subtitle, updatedAt, children }: Props) {
  return (
    <main className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>BELLU · RECHTLICH</div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            {subtitle ?? "Transparenz, Klarheit und faire Bedingungen — im selben Neo-Look wie Preise."}
          </p>

          <div className={styles.metaRow}>
            {updatedAt ? <span className={styles.chip}>Letztes Update: {updatedAt}</span> : null}
            <Link className={styles.chipLink} href="/pricing">
              Preise
            </Link>
            <Link className={styles.chipLink} href="/help">
              Hilfe
            </Link>
            <Link className={styles.chipLink} href="/marketplace">
              Marketplace
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardInner}>{children}</div>
        </article>

        <aside className={styles.side}>
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h3 className={styles.h3}>Schnellnavigation</h3>
              <div className={styles.links}>
                <Link className={styles.linkBtn} href="/impressum">
                  Impressum
                </Link>
                <Link className={styles.linkBtn} href="/datenschutz">
                  Datenschutz
                </Link>
                <Link className={styles.linkBtn} href="/agb">
                  AGB
                </Link>
                <Link className={styles.linkBtn} href="/pricing">
                  Preise
                </Link>
              </div>
              <p className={styles.small}>
                Hinweis: Diese Texte sind ein solider Start. Für finale Publikation lohnt sich ein kurzer
                Legal-Check (CH DSG/OR + ggf. DSGVO).
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h3 className={styles.h3}>Support</h3>
              <p className={styles.small}>
                Fragen zu Rechnungen, Downloads oder Refund? Schreib uns:
              </p>
              <div className={styles.monoBox}>support@bellu.ch</div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
