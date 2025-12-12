// src/app/pricing/page.tsx
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Preise & Gebühren – DigiEmu",
  description:
    "Transparente 80/20-Aufteilung für digitale Produkte. Keine Fixkosten, nur Gebühren bei Verkauf.",
};

export default function PricingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.inner}>
        {/* Header */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>Preise & Gebühren</p>
          <h1 className={styles.title}>
            Transparente Konditionen für digitale Produkte.
          </h1>
          <p className={styles.lead}>
            DigiEmu ist ein Marktplatz für digitale Produkte. Du konzentrierst
            dich auf deine Inhalte – wir kümmern uns um Checkout, Download und
            Plattformbetrieb.
          </p>
        </header>

        {/* Hauptplan-Karte */}
        <section className={styles.cardSection}>
          <article className={styles.planCard}>
            <div className={styles.planHeader}>
              <p className={styles.planBadge}>
                0&nbsp;CHF / Monat · 20% Plattformgebühr
              </p>
              <h2 className={styles.planTitle}>
                Einfaches Modell: 80% für dich, 20% für die Plattform
              </h2>
              <p className={styles.planIntro}>
                Pro Verkauf behältst du als Verkäufer:in 80% des Verkaufspreises.
                Die restlichen 20% nutzen wir für Zahlungsabwicklung,
                Download-Infrastruktur, Weiterentwicklung und Support.
              </p>
            </div>

            <div className={styles.planGrid}>
              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Keine Fixkosten</h3>
                <p className={styles.blockText}>
                  Keine Setup-Gebühr, kein Monatsabo. Du zahlst nur, wenn du
                  wirklich verkaufst.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Faire Aufteilung</h3>
                <p className={styles.blockText}>
                  80% gehen direkt an dich als Verkäufer:in.
                  20% finanzieren Infrastruktur, Sicherheit und Betrieb.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Stripe & Steuern</h3>
                <p className={styles.blockText}>
                  Zahlungen laufen über Stripe. Transaktionsgebühren von Stripe
                  sind in den 20% Plattformanteil einkalkuliert. Steuern auf
                  deine Einnahmen meldest du wie gewohnt in deiner Steuererklärung.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Für Käufer – klare Preise</h3>
                <p className={styles.blockText}>
                  Käufer:innen sehen immer den Endpreis in CHF inklusive aller
                  Gebühren. Nach dem Kauf erhalten sie sofort Zugriff auf ihren
                  Download im Kundenkonto.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Auszahlung an dich</h3>
                <p className={styles.blockText}>
                  Deine Einnahmen werden in deinem Verkäufer-Dashboard erfasst.
                  Auszahlungen erfolgen gesammelt auf dein Stripe-Konto, sobald
                  der Mindestbetrag erreicht ist.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Keine versteckten Klauseln</h3>
                <p className={styles.blockText}>
                  Keine Paywalls, keine Upgrade-Stufen. Ein einfaches Modell:
                  du lädst hoch, verkaufst, erhältst 80% – transparent und
                  nachvollziehbar im Dashboard.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Kleiner Hinweis / Footer-Text */}
        <section className={styles.noteSection}>
          <p className={styles.noteText}>
            Hinweis: DigiEmu ist aktuell im Aufbau. Konditionen können sich
            während der Beta-Phase leicht anpassen. Größere Änderungen werden
            wir frühzeitig im Dashboard kommunizieren.
          </p>
        </section>

        <footer className={styles.footer}>
          © {new Date().getFullYear()} DigiEmu – Digital Marketplace for Creators
        </footer>
      </section>
    </main>
  );
}
