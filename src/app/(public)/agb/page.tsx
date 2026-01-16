export const dynamic = "force-static";

import LegalShell from "@/components/legal/LegalShell";
import LegalToc from "@/components/legal/LegalToc";

export default function AgbPage() {
  const toc = [
    { id: "geltungsbereich", label: "1. Geltungsbereich" },
    { id: "digitale-inhalte", label: "2. Digitale Inhalte" },
    { id: "verkaeufer", label: "3. Verkäufer (Vendors)" },
    { id: "missbrauch", label: "4. Missbrauch" },
    { id: "haftung", label: "5. Haftung" },
    { id: "schlussbestimmungen", label: "6. Schlussbestimmungen" },
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

        <div className="space-y-3 text-sm text-[var(--text-main)]">
          <p>
            Diese AGB sind ein MVP-Entwurf. Für den produktiven Einsatz sollten sie abschließend juristisch geprüft werden.
          </p>

          <h2 id="geltungsbereich" className="text-base font-semibold">1. Geltungsbereich</h2>
          <p className="text-[var(--text-muted)]">
            Diese Bedingungen gelten für Käufe und Verkäufe digitaler Produkte über DigiEmu.
          </p>

          <h2 id="digitale-inhalte" className="text-base font-semibold">2. Digitale Inhalte</h2>
          <p className="text-[var(--text-muted)]">
            Nach erfolgreicher Zahlung erhält der Käufer unverzüglich Zugriff auf den Download gemäß der jeweiligen Produktbeschreibung.
            Bei digitalen Inhalten beginnt der Verkäufer mit der Bereitstellung unmittelbar nach Zahlungseingang.
          </p>

          <h3 className="text-sm font-semibold">Widerruf / Rücktritt</h3>
          <p className="text-[var(--text-muted)]">
            Bei digitalen Inhalten besteht nach Beginn der Ausführung kein Widerrufsrecht, wenn der Käufer ausdrücklich zustimmt,
            dass mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist begonnen wird und er seine Kenntnis bestätigt,
            dass er durch seine Zustimmung sein Widerrufsrecht verliert.
          </p>

          <h2 id="verkaeufer" className="text-base font-semibold">3. Verkäufer (Vendoren)</h2>
          <p className="text-[var(--text-muted)]">
            Vendoren dürfen Produkte nur anbieten, wenn ihr Verkäuferprofil freigeschaltet ist. Verstöße können zur Sperrung führen.
          </p>

          <h2 id="missbrauch" className="text-base font-semibold">4. Missbrauch</h2>
          <p className="text-[var(--text-muted)]">
            Automatisiertes Scraping, Account-Missbrauch und unautorisierte Weitergabe von Downloads kann zur Sperrung führen.
          </p>

          <h2 id="schlussbestimmungen" className="text-base font-semibold">Gerichtsstand</h2>
          <p className="text-[var(--text-muted)]">
            Sofern nicht ausdrücklich anders vereinbart, gilt Schweizer Recht. Gerichtsstand ist Zürich, Schweiz.
          </p>
        </div>
      </section>
      </main>
    </LegalShell>
  );
}
