// src/app/legal/agb/page.tsx
import Link from "next/link";
import styles from "../legalPage.module.css";

export const dynamic = "force-dynamic";

function formatDateCH(date = new Date()) {
  try {
    return date.toLocaleDateString("de-CH");
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default function Page() {
  const stand = formatDateCH();

  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.kicker}>DIGIEMU · RECHTLICHES</div>
          <h1 className={styles.title}>Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p className={styles.subtitle}>
            Stand: {stand} · Hinweis: Vorlage – bitte juristisch prüfen lassen.
          </p>

          <div className={styles.pillRow}>
            <Link className={styles.pill} href="/marketplace">
              Marketplace
            </Link>
            <Link className={styles.pill} href="/preise">
              Preise
            </Link>
            <Link className={styles.pill} href="/help">
              Hilfe
            </Link>
          </div>

          <hr className={styles.hr} />

          <div className={styles.section}>
            <h2 className={styles.h2}>1. Geltungsbereich</h2>
            <p className={styles.p}>
              Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Plattform DigiEmu
              (nachfolgend „Plattform“) durch Käufer:innen („Kund:innen“) und Verkäufer:innen
              („Anbieter:innen“). DigiEmu betreibt einen digitalen Marktplatz, auf dem Anbieter:innen
              digitale Produkte (z. B. Dateien, Inhalte, Software, Konzepte) anbieten können.
              Abweichende Bedingungen der Nutzer:innen finden keine Anwendung, es sei denn, DigiEmu
              stimmt ihrer Geltung ausdrücklich schriftlich zu.
            </p>

            <h2 className={styles.h2}>2. Betreiber der Plattform</h2>
            <p className={styles.p}>
              DigiEmu · Betreiber: <strong>[Name / Firma eintragen]</strong> · Adresse:{" "}
              <strong>[Adresse]</strong> · E-Mail: <strong>[Kontaktadresse]</strong> · Sitz:{" "}
              <strong>Schweiz</strong>
            </p>

            <h2 className={styles.h2}>3. Vertragsverhältnisse</h2>
            <ul className={styles.list}>
              <li>DigiEmu stellt ausschließlich die technische Plattform zur Verfügung.</li>
              <li>
                Kaufverträge über digitale Produkte kommen ausschließlich zwischen Käufer:in und
                Verkäufer:in zustande.
              </li>
              <li>
                DigiEmu ist nicht Vertragspartei dieser Kaufverträge und übernimmt keine Verantwortung
                für die angebotenen Inhalte, deren Qualität, Rechtmäßigkeit oder Eignung.
              </li>
            </ul>

            <h2 className={styles.h2}>4. Registrierung &amp; Benutzerkonto</h2>
            <ul className={styles.list}>
              <li>Für bestimmte Funktionen (Kauf, Download, Verkauf, Dashboard) ist eine Registrierung erforderlich.</li>
              <li>Die bei der Registrierung gemachten Angaben müssen vollständig und wahrheitsgemäß sein.</li>
              <li>Du bist für die Sicherheit deiner Zugangsdaten selbst verantwortlich.</li>
              <li>
                DigiEmu behält sich vor, Benutzerkonten bei Verstößen gegen diese AGB oder bei missbräuchlicher Nutzung
                zu sperren oder zu löschen.
              </li>
            </ul>

            <h2 className={styles.h2}>5. Angebote &amp; Inhalte der Verkäufer:innen</h2>
            <ul className={styles.list}>
              <li>
                Verkäufer:innen sind allein verantwortlich für Inhalt, Beschreibung und Preis ihrer Produkte sowie die
                Einhaltung gesetzlicher Vorschriften (z. B. Urheberrecht, Markenrecht).
              </li>
              <li>
                Verkäufer:innen versichern, dass sie über alle notwendigen Rechte an den angebotenen digitalen Inhalten
                verfügen.
              </li>
              <li>
                Verboten sind insbesondere: rechtswidrige Inhalte, Inhalte, die Persönlichkeitsrechte verletzen, sowie
                Schadsoftware, Malware oder irreführende Inhalte.
              </li>
            </ul>

            <h2 className={styles.h2}>6. Preise &amp; Zahlungsabwicklung</h2>
            <ul className={styles.list}>
              <li>Die angegebenen Preise verstehen sich in der jeweils ausgewiesenen Währung.</li>
              <li>Die Zahlungsabwicklung erfolgt über externe Zahlungsdienstleister (z. B. Stripe).</li>
              <li>
                DigiEmu erhebt eine Plattformgebühr, die vom Verkaufspreis einbehalten wird. Die genaue Höhe richtet sich
                nach dem jeweils gültigen Gebührenmodell.
              </li>
            </ul>

            <h2 className={styles.h2}>7. Download &amp; Bereitstellung digitaler Inhalte</h2>
            <ul className={styles.list}>
              <li>Nach erfolgreichem Zahlungseingang wird der digitale Inhalt zum Download bereitgestellt.</li>
              <li>Downloads können zeitlich begrenzt und/oder mengenmäßig limitiert sein.</li>
              <li>Käufer:innen sind selbst dafür verantwortlich, die Dateien rechtzeitig zu sichern.</li>
            </ul>

            <h2 className={styles.h2}>8. Widerrufsrecht &amp; Rückerstattung</h2>
            <p className={styles.p}>
              Bei digitalen Inhalten kann das Widerrufsrecht gemäß geltendem Recht erlöschen, sobald der Download begonnen
              hat und der/die Käufer:in ausdrücklich zugestimmt hat. Rückerstattungen erfolgen ausschließlich gemäß den
              Bedingungen des jeweiligen Verkäufers und der gesetzlichen Vorgaben.
            </p>

            <h2 className={styles.h2}>9. Haftung</h2>
            <ul className={styles.list}>
              <li>
                DigiEmu haftet nur für Schäden, die auf vorsätzlicher oder grob fahrlässiger Pflichtverletzung beruhen.
              </li>
              <li>Für Inhalte, Produkte und Leistungen der Verkäufer:innen übernimmt DigiEmu keine Haftung.</li>
              <li>
                Die Haftung für indirekte Schäden, Folgeschäden oder entgangenen Gewinn ist ausgeschlossen, soweit
                gesetzlich zulässig.
              </li>
            </ul>

            <h2 className={styles.h2}>10. Verfügbarkeit der Plattform</h2>
            <p className={styles.p}>
              DigiEmu bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der Plattform. Wartungsarbeiten,
              technische Störungen oder Ereignisse außerhalb des Einflussbereichs können zu vorübergehenden Einschränkungen
              führen.
            </p>

            <h2 className={styles.h2}>11. Datenschutz</h2>
            <p className={styles.p}>
              Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung von DigiEmu. Externe Zahlungs-
              und Serviceanbieter verarbeiten Daten in eigener Verantwortung.
            </p>

            <h2 className={styles.h2}>12. Änderungen der AGB</h2>
            <p className={styles.p}>
              DigiEmu behält sich vor, diese AGB jederzeit anzupassen. Nutzer:innen werden über wesentliche Änderungen
              informiert. Die weitere Nutzung der Plattform gilt als Zustimmung zu den geänderten AGB.
            </p>

            <h2 className={styles.h2}>13. Anwendbares Recht &amp; Gerichtsstand</h2>
            <p className={styles.p}>
              Es gilt schweizerisches Recht, unter Ausschluss des internationalen Privatrechts. Gerichtsstand ist – soweit
              gesetzlich zulässig – der Sitz des Plattformbetreibers.
            </p>

            <h2 className={styles.h2}>14. Salvatorische Klausel</h2>
            <p className={styles.p}>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen
              Bestimmungen unberührt.
            </p>

            <p className={styles.muted}>
              Hinweis: Diese AGB stellen keine Rechtsberatung dar und ersetzen keine individuelle Prüfung durch eine
              juristische Fachperson.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
