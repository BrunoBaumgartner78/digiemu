export const dynamic = "force-static";

import LegalShell from "@/components/legal/LegalShell";

export default function ImpressumPage() {
  return (
    <LegalShell
      eyebrow="RECHTLICHES"
      title="Impressum"
      lead="Angaben gemäss gesetzlichen Vorgaben. (MVP-Entwurf – bitte vor Launch prüfen und finalisieren.)"
    >
      <main className="page-shell">
      <section className="neo-surface neonCard neonBorder glowSoft p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Impressum</h1>

        <div className="space-y-3 text-sm text-[var(--text-main)]">
          <p><strong>Betreiber:</strong> DigiEmu / Baumgartner Web Design & Development</p>
          <p><strong>Inhaber:</strong> Bruno Baumgartner</p>
          <p><strong>Adresse:</strong> Musterstrasse 1, 8000 Zürich (Bitte auf echte Adresse anpassen)</p>
          <p><strong>Kontakt:</strong> support@bellu.ch</p>
          <p><strong>UID / Handelsregister:</strong> (sofern vorhanden, bitte ergänzen)</p>

          <p className="text-[var(--text-muted)]">
            Hinweis: Dieses Impressum ist ein MVP-Entwurf und enthält Beispielangaben. Ergänze die tatsächlichen Firmendaten vor dem öffentlichen Start.
          </p>
        </div>

        <div className="text-sm text-[var(--text-muted)] space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Haftungsausschluss</h2>
          <p>
            Inhalte wurden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität übernehmen wir keine Gewähr.
          </p>
        </div>
      </section>
    </main>
    </LegalShell>
  );
}
