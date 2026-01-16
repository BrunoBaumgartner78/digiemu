// src/app/(public)/help/page.tsx
import Link from "next/link";
import styles from "../../help/page.module.css";

export const dynamic = "force-dynamic";

export default function HelpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>Hilfe & FAQ</p>
          <h1 className={styles.title}>Antworten für Käufer und Verkäufer</h1>
          <p className={styles.subtitle}>
            Hier findest du die wichtigsten Antworten rund um Kauf, Download,
            Upload und Auszahlungen – ruhig, transparent und auf den Punkt.
          </p>

          <div className="mt-4 text-sm text-[var(--text-muted)]">
            <h3 className="font-semibold">Support & Kontakt</h3>
            <p>
              Bei Problemen mit Checkout oder Downloads sende bitte eine E-Mail an <strong>support@bellu.ch</strong> und
              gib folgende Informationen an: Bestellnummer (OrderId), E-Mail-Adresse, kurze Fehlerbeschreibung und optional
              ein Screenshot. Antwortzeit: in der Regel innerhalb von 48 Stunden während der Beta-Phase.
            </p>
          </div>

          {/* Schnellnavigation */}
          <nav
            className={styles.quickNav}
            aria-label="Schnellnavigation Hilfe-Bereiche"
          >
            <a href="#buyers" className={styles.quickNavLink}>
              🛒 Für Käufer
            </a>
            <a href="#vendors" className={styles.quickNavLink}>
              🧾 Für Verkäufer
            </a>
            <a href="#tech" className={styles.quickNavLink}>
              🔒 Technik &amp; Sicherheit
            </a>
          </nav>
        </header>

        {/* Inhalt */}
        <main className={styles.grid}>
          {/* Käufer */}
          <section
            id="buyers"
            aria-labelledby="buyers-heading"
            className={styles.section}
          >
            <div className={`${styles.sectionCard} neonCard neonBorder glowSoft`}>
              <h2 id="buyers-heading" className={styles.sectionTitle}>
                Für Käufer
              </h2>
              <p className={styles.sectionIntro}>
                Alles rund um Kauf, Download und Zugang zu deinen digitalen
                Produkten.
              </p>

              <div className={styles.faqList}>
                <details className={styles.faqItem} open>
                  <summary className={styles.faqSummary}>
                    Wie kaufe ich ein Produkt?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      Du wählst im Marketplace ein Produkt aus, klickst auf{" "}
                      <strong>„Einmal zahlen · sofort laden“</strong> und wirst
                      zum sicheren Stripe-Checkout weitergeleitet. Nach
                      erfolgreicher Zahlung wirst du automatisch auf die
                      Download-Seite von DigiEmu geführt.
                    </p>
                  </div>
                </details>

                <details className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    Wie erhalte ich meinen Download?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      Direkt nach dem Kauf leiten wir dich auf eine{" "}
                      <strong>Download-Seite</strong> weiter. Dort kannst du
                      deine Datei herunterladen, solange dein Zugang aktiv ist.
                    </p>
                    <p>
                      Zusätzlich kannst du die Bestellung später in deinem
                      Konto wiederfinden (falls der Anbieter diese Funktion
                      aktiviert hat).
                    </p>
                  </div>
                </details>

                <details className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    Was, wenn der Download-Link nicht funktioniert?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      In seltenen Fällen kann es zu technischen Pausen oder
                      Zeitüberschreitungen kommen. Versuche es zuerst nach
                      kurzer Zeit erneut.
                    </p>
                    <p>
                      Wenn es weiterhin nicht klappt, kontaktiere bitte den
                      Support mit deiner <strong>Bestellnummer</strong>. Wir
                      helfen dir manuell weiter.
                    </p>
                  </div>
                </details>

                <details className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    Kann ich einen Kauf stornieren?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      Bei digitalen Produkten gilt in vielen Fällen kein
                      klassisches Rückgaberecht, sobald der Download begonnen
                      hat. Im Einzelfall entscheidet der jeweilige Anbieter.
                    </p>
                    <p>
                      Wenn du ein Problem mit einem Produkt hast, melde dich
                      beim Support – wir prüfen gemeinsam eine faire Lösung.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </section>

          {/* Verkäufer */}
          <section
            id="vendors"
            aria-labelledby="vendors-heading"
            className={styles.section}
          >
            <div className={`${styles.sectionCard} neonCard neonBorder glowSoft`}>
              <h2 id="vendors-heading" className={styles.sectionTitle}>
                Für Verkäufer
              </h2>
              <p className={styles.sectionIntro}>
                So wirst du Verkäufer:in, lädst Produkte hoch und erhältst deine
                Auszahlungen.
              </p>

              <div className={styles.faqList}>
                <details className={styles.faqItem} open>
                  <summary className={styles.faqSummary}>
                    Wie werde ich Verkäufer:in?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      Du registrierst dich als Nutzer:in, wechselst ins{" "}
                      <strong>Dashboard</strong> und legst ein
                      Verkäufer-Profil an. Danach kannst du Produkte mit wenigen
                      Schritten hochladen.
                    </p>
                  </div>
                </details>

                <details className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    Wie funktionieren Auszahlungen?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      Pro Verkauf erhältst du <strong>80&nbsp;%</strong> des
                      Netto-Verkaufspreises. Die restlichen{" "}
                      <strong>20&nbsp;%</strong> nutzt DigiEmu für
                      Zahlungsabwicklung, Download-Infrastruktur, Sicherheit und
                      Plattformbetrieb.
                    </p>
                    <p>
                      Auszahlungen erfolgen gebündelt in regelmäßigen Abständen
                      auf das von dir hinterlegte Konto.
                    </p>
                  </div>
                </details>

                <details className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    Welche Inhalte darf ich verkaufen?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      Erlaubt sind digitale Produkte wie E-Books, Vorlagen,
                      Kurse, Audiodateien oder Arbeitsblätter, sofern du die
                      Rechte daran besitzt und sie keine geltenden Gesetze
                      verletzen.
                    </p>
                    <p>
                      Verboten sind z.&nbsp;B. gewaltverherrlichende,
                      diskriminierende oder urheberrechtsverletzende Inhalte.
                    </p>
                  </div>
                </details>

                <details className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    Was passiert bei Streitfällen?
                  </summary>
                  <div className={styles.faqBody}>
                    <p>
                      Im Konfliktfall zwischen Käufer:in und Verkäufer:in kann
                      DigiEmu vermitteln und Zahlungsflüsse vorübergehend
                      pausieren. Unser Ziel ist eine faire Lösung für beide
                      Seiten.
                    </p>
                  </div>
                </details>
              </div>
            </div>

            {/* Technik & Sicherheit */}
            <section
              id="tech"
              aria-labelledby="tech-heading"
              className={styles.sectionWide}
            >
              <div className={`${styles.sectionCard} neonCard neonBorder glowSoft`}>
                <h2 id="tech-heading" className={styles.sectionTitle}>
                  Technik, Sicherheit &amp; Support
                </h2>
                <p className={styles.sectionIntro}>
                  DigiEmu wurde so gebaut, dass Zahlungen, Downloads und Daten
                  möglichst sicher und stabil laufen.
                </p>

                <div className={styles.faqList}>
                  <details className={styles.faqItem} open>
                    <summary className={styles.faqSummary}>
                      Wie sicher ist die Bezahlung?
                    </summary>
                    <div className={styles.faqBody}>
                      <p>
                        Zahlungen laufen über <strong>Stripe</strong>, einen
                        international zertifizierten Zahlungsdienstleister. Deine
                        Karten­daten werden nicht bei DigiEmu gespeichert.
                      </p>
                    </div>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqSummary}>
                      Woher kommt mein Download?
                    </summary>
                    <div className={styles.faqBody}>
                      <p>
                        Die Dateien liegen auf einer sicheren Infrastruktur, die
                        speziell für digitale Produkte ausgelegt ist. Der
                        Download-Link ist nur für dich bestimmt und kann technisch
                        begrenzt sein, um Missbrauch zu verhindern.
                      </p>
                    </div>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqSummary}>
                      Wie erreiche ich den Support?
                    </summary>
                    <div className={styles.faqBody}>
                      <p>
                        Wenn du Hilfe brauchst, erreichst du uns über das
                        Kontakt- oder Support-Formular auf der Seite{" "}
                        <Link href="/contact" className={styles.linkInline}>
                          Kontakt
                        </Link>{" "}
                        (sofern aktiviert) oder per E-Mail. Bitte gib immer deine
                        Bestellnummer oder Produkt-ID an.
                      </p>
                    </div>
                  </details>
                </div>
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
