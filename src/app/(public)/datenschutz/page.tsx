export const dynamic = "force-static";

export default function DatenschutzPage() {
  return (
    <main className="page-shell">
      <section className="neo-surface neonCard neonBorder glowSoft p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Datenschutz</h1>

        <div className="space-y-3 text-sm text-[var(--text-main)]">
          <p>
            Diese Datenschutzerklärung ist ein MVP-Entwurf. Sie beschreibt grundsätzlich, welche Daten beim Besuch und bei der Nutzung
            der Plattform verarbeitet werden.
          </p>

          <h2 className="text-base font-semibold">Verarbeitete Daten</h2>
          <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
            <li>Accountdaten (E-Mail, Login, Rollen)</li>
            <li>Kauf- und Zahlungsdaten (über Stripe, wir speichern nur notwendige Referenzen)</li>
            <li>Download-Logs (zur Missbrauchsvermeidung und Abrechnung)</li>
            <li>Technische Daten (IP, User-Agent) für Sicherheit/Logs</li>
          </ul>

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
  );
}
