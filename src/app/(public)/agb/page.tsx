export const dynamic = "force-static";

export default function AgbPage() {
  return (
    <main className="page-shell">
      <section className="neo-surface neonCard neonBorder glowSoft p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-semibold">AGB</h1>

        <div className="space-y-3 text-sm text-[var(--text-main)]">
          <p>
            Diese AGB sind ein MVP-Entwurf. Für einen produktiven Launch sollten sie juristisch geprüft werden.
          </p>

          <h2 className="text-base font-semibold">1. Geltungsbereich</h2>
          <p className="text-[var(--text-muted)]">
            Diese Bedingungen gelten für Käufe und Verkäufe digitaler Produkte über DigiEmu.
          </p>

          <h2 className="text-base font-semibold">2. Digitale Inhalte</h2>
          <p className="text-[var(--text-muted)]">
            Nach erfolgreicher Zahlung erhält der Käufer Zugriff auf den Download gemäß der jeweiligen Produktbeschreibung.
          </p>

          <h2 className="text-base font-semibold">3. Verkäufer (Vendoren)</h2>
          <p className="text-[var(--text-muted)]">
            Vendoren dürfen Produkte nur anbieten, wenn ihr Verkäuferprofil freigeschaltet ist. Verstöße können zur Sperrung führen.
          </p>

          <h2 className="text-base font-semibold">4. Missbrauch</h2>
          <p className="text-[var(--text-muted)]">
            Automatisiertes Scraping, Account-Missbrauch und unautorisierte Weitergabe von Downloads kann zur Sperrung führen.
          </p>
        </div>
      </section>
    </main>
  );
}
