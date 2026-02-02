// src/app/agb/page.tsx
export const dynamic = "force-static";

import LegalShell from "@/components/legal/LegalShell";
import LegalToc from "@/components/legal/LegalToc";

export default function AgbPage() {
  const toc = [
    { id: "geltungsbereich", label: "1. Geltungsbereich" },
    { id: "konto", label: "2. Nutzerkonto" },
    { id: "vertragsschluss", label: "3. Vertragsschluss" },
    { id: "digitale-inhalte", label: "4. Digitale Inhalte" },
    { id: "zahlung", label: "5. Preise & Zahlung" },
    { id: "verkaeufer", label: "6. Verkäufer (Vendors)" },
    { id: "provision", label: "7. Provision & Auszahlungen" },
    { id: "missbrauch", label: "8. Missbrauch" },
    { id: "haftung", label: "9. Haftung" },
    { id: "verfuegbarkeit", label: "10. Verfügbarkeit" },
    { id: "aenderungen", label: "11. Änderungen der AGB" },
    { id: "schlussbestimmungen", label: "12. Schlussbestimmungen" },
  ];

  return (
    <LegalShell
      eyebrow="RECHTLICHES"
      title="AGB"
      lead="Diese AGB sind ein MVP-Entwurf. Für den produktiven Einsatz sollten sie abschliessend juristisch geprüft werden."
    >
      <LegalToc items={toc} />

      <main className="page-shell">
        <section className="neo-surface neonCard neonBorder glowSoft p-6 md:p-8 space-y-6">
          <h1 className="text-2xl font-semibold">AGB</h1>

          <div className="space-y-4 text-sm text-[var(--text-main)]">
            <p className="text-[var(--text-muted)]">
              Diese Allgemeinen Geschäftsbedingungen (AGB) sind ein MVP-Entwurf. Für den produktiven Einsatz
              sollten sie abschliessend juristisch geprüft werden.
            </p>

            <h2 id="geltungsbereich" className="text-base font-semibold">1. Geltungsbereich</h2>
            <p className="text-[var(--text-muted)]">
              Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Plattform <strong>Bellu</strong>
              (nachfolgend „Plattform“) sowie den Kauf und Verkauf digitaler Inhalte.
            </p>
            <p className="text-[var(--text-muted)]">
              Bellu betreibt einen digitalen Marktplatz. Vertragspartner beim Erwerb digitaler Produkte ist grundsätzlich
              der jeweilige Verkäufer (Vendor), nicht Bellu selbst. Bellu vermittelt die Transaktion und stellt die technische
              Infrastruktur (insbesondere Produktdarstellung, Checkout, Downloadbereitstellung) bereit.
            </p>

            <h2 id="konto" className="text-base font-semibold">2. Nutzerkonto</h2>
            <p className="text-[var(--text-muted)]">
              Für den Kauf oder Verkauf digitaler Inhalte kann die Erstellung eines Nutzerkontos erforderlich sein.
              Nutzer sind verpflichtet, bei der Registrierung richtige und vollständige Angaben zu machen und diese aktuell zu halten.
            </p>
            <p className="text-[var(--text-muted)]">
              Nutzer sind für die Geheimhaltung ihrer Zugangsdaten verantwortlich. Bellu übernimmt keine Haftung für Schäden,
              die durch die missbräuchliche Nutzung von Nutzerkonten entstehen, soweit dies gesetzlich zulässig ist.
            </p>

            <h2 id="vertragsschluss" className="text-base font-semibold">3. Vertragsschluss</h2>
            <p className="text-[var(--text-muted)]">
              Die Darstellung digitaler Produkte auf der Plattform stellt kein rechtlich bindendes Angebot dar.
              Ein Vertrag über digitale Inhalte kommt zustande, sobald der Käufer den Zahlungsvorgang erfolgreich abschliesst
              und der Verkäufer den digitalen Inhalt gemäss Produktbeschreibung bereitstellt.
            </p>

            <h2 id="digitale-inhalte" className="text-base font-semibold">4. Digitale Inhalte</h2>
            <p className="text-[var(--text-muted)]">
              Nach erfolgreicher Zahlung erhält der Käufer unverzüglich Zugriff auf den Download gemäss der jeweiligen Produktbeschreibung.
              Die Bereitstellung erfolgt elektronisch (z. B. Download-Link oder Zugriff im Nutzerkonto).
            </p>

            <h3 className="text-sm font-semibold">Widerruf / Rücktritt</h3>
            <p className="text-[var(--text-muted)]">
              Bei digitalen Inhalten besteht kein Widerrufsrecht, sobald mit der Ausführung des Vertrags begonnen wurde, sofern der Käufer
              ausdrücklich zugestimmt hat, dass mit der Ausführung vor Ablauf einer Widerrufsfrist begonnen wird, und er zur Kenntnis genommen hat,
              dass er dadurch sein Widerrufsrecht verliert (soweit ein Widerrufsrecht überhaupt anwendbar ist).
            </p>

            <h2 id="zahlung" className="text-base font-semibold">5. Preise &amp; Zahlung</h2>
            <p className="text-[var(--text-muted)]">
              Alle Preise werden in der jeweils angegebenen Währung angezeigt. Die Zahlungsabwicklung erfolgt über externe Zahlungsdienstleister
              (z. B. Stripe). Bellu speichert keine vollständigen Zahlungsdaten.
            </p>
            <p className="text-[var(--text-muted)]">
              Es gelten ergänzend die Geschäftsbedingungen des jeweiligen Zahlungsdienstleisters. Die Verfügbarkeit bestimmter Zahlungsarten
              kann je nach Region, Gerät oder Zahlungsanbieter variieren.
            </p>

            <h2 id="verkaeufer" className="text-base font-semibold">6. Verkäufer (Vendors)</h2>
            <p className="text-[var(--text-muted)]">
              Verkäufer dürfen digitale Inhalte nur anbieten, wenn ihr Verkäuferprofil freigeschaltet ist. Verkäufer sind allein verantwortlich
              für die Rechtmässigkeit, Richtigkeit und Vollständigkeit ihrer Produktinhalte und -beschreibungen, einschliesslich Urheber-,
              Marken- und Nutzungsrechten.
            </p>
            <p className="text-[var(--text-muted)]">
              Bellu ist nicht Partei des Vertrags zwischen Käufer und Verkäufer und übernimmt keine Gewähr für die Inhalte der Verkäufer.
              Beanstandungen im Zusammenhang mit dem Produkt sind grundsätzlich an den jeweiligen Verkäufer zu richten.
            </p>

            <h2 id="provision" className="text-base font-semibold">7. Provision &amp; Auszahlungen</h2>
            <p className="text-[var(--text-muted)]">
              Bellu erhebt für vermittelte Verkäufe eine Plattformprovision. Die Höhe der Provision sowie allfällige weitere Gebühren werden
              im Verkäufer-Dashboard bzw. im Rahmen des Verkäufer-Onboardings ausgewiesen.
            </p>
            <p className="text-[var(--text-muted)]">
              Auszahlungen an Verkäufer erfolgen gemäss den im Dashboard angegebenen Bedingungen und Zeiträumen. Bellu kann Auszahlungen
              vorübergehend zurückhalten, wenn dies zur Betrugsprävention, zur Klärung von Rückbelastungen (Chargebacks) oder zur Erfüllung
              gesetzlicher Pflichten erforderlich ist.
            </p>

            <h2 id="missbrauch" className="text-base font-semibold">8. Missbrauch</h2>
            <p className="text-[var(--text-muted)]">
              Unzulässig sind insbesondere automatisiertes Scraping, Betrug, Account-Missbrauch, Umgehung technischer Schutzmassnahmen,
              unautorisierte Weitergabe von Downloads sowie Handlungen, die die Plattform oder andere Nutzer beeinträchtigen.
              Bellu kann bei Verdacht oder Nachweis von Missbrauch Inhalte entfernen, Transaktionen sperren oder Nutzerkonten vorübergehend
              oder dauerhaft sperren.
            </p>

            <h2 id="haftung" className="text-base font-semibold">9. Haftung</h2>
            <p className="text-[var(--text-muted)]">
              Bellu haftet ausschliesslich für Schäden, die durch vorsätzliches oder grob fahrlässiges Verhalten von Bellu verursacht wurden.
              Für Inhalte, Leistungen und Rechtsverletzungen der Verkäufer übernimmt Bellu keine Haftung, soweit gesetzlich zulässig.
            </p>
            <p className="text-[var(--text-muted)]">
              Die Haftung für leichte Fahrlässigkeit sowie für indirekte Schäden, Folgeschäden, entgangenen Gewinn oder Datenverlust ist ausgeschlossen,
              soweit gesetzlich zulässig.
            </p>

            <h2 id="verfuegbarkeit" className="text-base font-semibold">10. Verfügbarkeit</h2>
            <p className="text-[var(--text-muted)]">
              Bellu bemüht sich um eine möglichst hohe Verfügbarkeit der Plattform, kann jedoch keine unterbrechungsfreie oder jederzeitige Verfügbarkeit
              garantieren. Wartungsarbeiten, Sicherheitsupdates oder Störungen bei Drittanbietern (z. B. Hosting, Zahlungsdienstleister) können zu
              vorübergehenden Einschränkungen führen.
            </p>

            <h2 id="aenderungen" className="text-base font-semibold">11. Änderungen der AGB</h2>
            <p className="text-[var(--text-muted)]">
              Bellu behält sich vor, diese AGB jederzeit anzupassen. Änderungen werden den Nutzern in geeigneter Form mitgeteilt. Soweit rechtlich erforderlich,
              werden Änderungen erst nach Zustimmung der Nutzer wirksam.
            </p>

            <h2 id="schlussbestimmungen" className="text-base font-semibold">12. Schlussbestimmungen</h2>
            <p className="text-[var(--text-muted)]">
              Sollte eine Bestimmung dieser AGB unwirksam oder undurchsetzbar sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              Anstelle der unwirksamen Bestimmung gilt eine Regelung als vereinbart, die dem wirtschaftlichen Zweck am nächsten kommt.
            </p>
            <p className="text-[var(--text-muted)]">
              Sofern nicht ausdrücklich anders vereinbart, gilt Schweizer Recht. Gerichtsstand ist Zürich, Schweiz.
            </p>
          </div>
        </section>
      </main>
    </LegalShell>
  );
}
