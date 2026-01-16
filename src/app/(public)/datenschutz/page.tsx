export const dynamic = "force-static";

import LegalShell from "@/components/legal/LegalShell";

export default function DatenschutzPage() {
  return (
    <LegalShell
      eyebrow="RECHTLICHES"
      title="Datenschutz"
      lead="Diese Datenschutzerklärung ist ein MVP-Entwurf. Für verbindliche Formulierungen empfehlen wir die Prüfung durch eine Fachperson."
    >
      <main className="page-shell">
      <section className="neo-surface neonCard neonBorder glowSoft p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Datenschutz</h1>

        <div className="space-y-3 text-sm text-[var(--text-main)]">
          <p>
            Diese Datenschutzerklärung ist ein MVP-Entwurf. Sie beschreibt, welche Daten beim Besuch und bei der Nutzung der Plattform
            verarbeitet werden, zu welchen Zwecken und auf welcher Rechtsgrundlage. Sie stellt die wichtigsten Informationen für Nutzerinnen
            und Nutzer bereit. Für detailliertere oder rechtlich verpflichtende Formulierungen empfehlen wir eine Prüfung durch eine Fachperson.
          </p>

          <h2 className="text-base font-semibold">Verarbeitete Daten</h2>
          <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
            <li>Accountdaten (E-Mail, Login, Rollen)</li>
            <li>Kauf- und Zahlungsdaten (über Stripe, wir speichern nur notwendige Referenzen)</li>
            <li>Download-Logs (zur Missbrauchsvermeidung und Abrechnung)</li>
            <li>Technische Daten (IP, User-Agent) für Sicherheit/Logs</li>
          </ul>

          <h2 className="text-base font-semibold">Empfänger / Drittanbieter</h2>
          <p className="text-[var(--text-muted)]">
            Wir nutzen Drittdienste zur Bereitstellung der Plattform. Dazu gehören u. a.:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
            <li>Vercel (Hosting, Logs),</li>
            <li>Stripe (Zahlungsabwicklung),</li>
            <li>Firebase / Google Cloud Storage (Datei-Uploads / Downloads),</li>
            <li>E-Mail-Dienstleister (für Support- und System-Mails).</li>
          </ul>

          <h2 className="text-base font-semibold">Rechtsgrundlagen & Aufbewahrung</h2>
          <p className="text-[var(--text-muted)]">
            Wir verarbeiten Daten zur Erfüllung von Verträgen (z. B. Bestellabwicklung), zur Erfüllung rechtlicher Pflichten sowie
            auf Basis berechtigter Interessen (z. B. Sicherheit, Missbrauchsbekämpfung). Logs und Metadaten werden aus Sicherheitsgründen
            und zur Abrechnung zeitlich begrenzt aufbewahrt; genaue Aufbewahrungsfristen richten sich nach gesetzlichen Vorgaben.
          </p>

          <h2 className="text-base font-semibold">Betroffenenrechte</h2>
          <p className="text-[var(--text-muted)]">
            Du hast das Recht auf Auskunft, Berichtigung, Widerspruch, Löschung sowie eingeschränkte Verarbeitung deiner Daten.
            Zur Ausübung deiner Rechte oder bei Fragen zum Datenschutz schreibe an: support@bellu.ch
          </p>

          <h2 className="text-base font-semibold">Drittanbieter</h2>
          <p className="text-[var(--text-muted)]">
            Zahlungen werden über Stripe abgewickelt. Datei-Uploads/Downloads können über Firebase Storage erfolgen.
          </p>

          <h2 className="text-base font-semibold">Kontakt</h2>
          <p className="text-[var(--text-muted)]">
            Bei Fragen: support@bellu.ch
          </p>
        </div>
      </section>
    </main>
    </LegalShell>
  );
}
