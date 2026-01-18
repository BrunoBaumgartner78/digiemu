// src/app/datenschutz/page.tsx
export const dynamic = "force-static";

import LegalShell from "@/components/legal/LegalShell";

export default function DatenschutzPage() {
  return (
    <LegalShell
      eyebrow="RECHTLICHES"
      title="Datenschutz"
      lead="Diese Datenschutzerklärung ist ein MVP-Entwurf. Für den produktiven Einsatz sollte sie abschliessend juristisch geprüft werden."
    >
      <main className="page-shell">
        <section className="neo-surface neonCard neonBorder glowSoft p-6 md:p-8 space-y-6">
          <h1 className="text-2xl font-semibold">Datenschutzerklärung</h1>

          <div className="space-y-4 text-sm text-[var(--text-main)]">
            <p className="text-[var(--text-muted)]">
              In dieser Datenschutzerklärung informieren wir darüber, welche personenbezogenen Daten bei der Nutzung der Plattform DigiEmu
              (bellu.ch) verarbeitet werden, zu welchen Zwecken und welche Rechte dir zustehen. Die Plattform wird in der Schweiz betrieben.
            </p>

            <h2 className="text-base font-semibold">1. Verantwortlicher</h2>
            <p className="text-[var(--text-muted)]">
              Verantwortlich für die Datenverarbeitung im Sinne des Datenschutzrechts ist der Betreiber der Plattform DigiEmu.
              Kontakt:{" "}
              <a className="underline" href="mailto:support@bellu.ch">
                support@bellu.ch
              </a>
            </p>

            <h2 className="text-base font-semibold">2. Verarbeitete Daten</h2>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
              <li>
                <strong>Accountdaten:</strong> E-Mail-Adresse, Name (optional), Passwort (verschlüsselt/Hash), Rollen/Status.
              </li>
              <li>
                <strong>Bestell-/Transaktionsdaten:</strong> Bestell-IDs, Produktreferenzen, Beträge, Zeitpunkte; Zahlungsabwicklung über
                Stripe (wir speichern nur notwendige Referenzen).
              </li>
              <li>
                <strong>Download- und Sicherheitslogs:</strong> Zeitpunkte, technische Metadaten (z. B. IP-Adresse, User-Agent) zur
                Missbrauchsvermeidung, Fehleranalyse und Abrechnung.
              </li>
              <li>
                <strong>Technische Daten:</strong> Server- und Zugriffsprotokolle (z. B. bei Hosting/Monitoring), Cookies/LocalStorage für
                Einstellungen (z. B. Cookie-Einwilligung).
              </li>
            </ul>

            <h2 className="text-base font-semibold">3. Zwecke der Verarbeitung</h2>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
              <li>Bereitstellung der Plattform (Registrierung, Login, Nutzung von Funktionen).</li>
              <li>Abwicklung von Käufen/Verkäufen digitaler Inhalte, Bereitstellung von Downloads.</li>
              <li>Sicherheit, Betrugs- und Missbrauchsprävention, Fehlerdiagnose.</li>
              <li>Kommunikation (Support- und System-E-Mails).</li>
              <li>
                <strong>Analytics (optional):</strong> nur sofern du dem zustimmst (Cookie-Einwilligung).
              </li>
            </ul>

            <h2 className="text-base font-semibold">4. Rechtsgrundlagen</h2>
            <p className="text-[var(--text-muted)]">
              Wir verarbeiten personenbezogene Daten insbesondere (a) zur Vertragserfüllung bzw. Durchführung vorvertraglicher Massnahmen,
              (b) zur Erfüllung rechtlicher Pflichten, sowie (c) auf Grundlage berechtigter Interessen (z. B. Betriebssicherheit,
              Missbrauchsbekämpfung). Optionale Analytics-Daten verarbeiten wir nur mit deiner Einwilligung.
            </p>

            <h2 className="text-base font-semibold">5. Empfänger / Drittanbieter</h2>
            <p className="text-[var(--text-muted)]">
              Wir nutzen Dienstleister, die Daten in unserem Auftrag verarbeiten oder als eigenständige Verantwortliche tätig sein können:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
              <li>
                <strong>Vercel</strong> (Hosting/Deployment/Logs)
              </li>
              <li>
                <strong>Stripe</strong> (Zahlungsabwicklung)
              </li>
              <li>
                <strong>Firebase / Google Cloud Storage</strong> (Datei-Uploads / Downloads)
              </li>
              <li>
                <strong>E-Mail-Dienstleister</strong> (System- und Support-Mails)
              </li>
            </ul>

            <h2 className="text-base font-semibold">6. Übermittlung ins Ausland</h2>
            <p className="text-[var(--text-muted)]">
              Je nach eingesetzten Dienstleistern kann eine Verarbeitung/Übermittlung von Daten in Länder ausserhalb der Schweiz/des EWR
              stattfinden (z. B. USA). Wir achten dabei auf geeignete Garantien (z. B. Standardvertragsklauseln) soweit erforderlich.
            </p>

            <h2 className="text-base font-semibold">7. Cookies & Einwilligung</h2>
            <p className="text-[var(--text-muted)]">
              Wir verwenden notwendige Cookies/LocalStorage-Einträge für den Betrieb (z. B. Login, Sicherheit, Cookie-Einwilligung).
              Optionale Analytics werden nur geladen, wenn du im Cookie-Banner zustimmst. Du kannst deine Entscheidung jederzeit löschen,
              indem du den LocalStorage-Eintrag entfernst oder die Browsereinstellungen nutzt.
            </p>

            <h2 className="text-base font-semibold">8. Aufbewahrung</h2>
            <p className="text-[var(--text-muted)]">
              Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich ist oder gesetzliche
              Aufbewahrungspflichten bestehen. Sicherheits- und Download-Logs werden grundsätzlich zeitlich begrenzt aufbewahrt und danach
              gelöscht oder anonymisiert.
            </p>

            <h2 className="text-base font-semibold">9. Deine Rechte</h2>
            <p className="text-[var(--text-muted)]">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Widerspruch, soweit anwendbar.
              Zur Ausübung deiner Rechte kontaktiere uns unter{" "}
              <a className="underline" href="mailto:support@bellu.ch">
                support@bellu.ch
              </a>
              .
            </p>

            <h2 className="text-base font-semibold">10. Kontakt</h2>
            <p className="text-[var(--text-muted)]">
              Fragen zum Datenschutz:{" "}
              <a className="underline" href="mailto:support@bellu.ch">
                support@bellu.ch
              </a>
            </p>

            <h2 className="text-base font-semibold">11. Änderungen</h2>
            <p className="text-[var(--text-muted)]">
              Wir können diese Datenschutzerklärung anpassen, wenn sich unsere Services oder rechtliche Anforderungen ändern. Es gilt die
              jeweils aktuelle Version auf dieser Seite.
            </p>
          </div>
        </section>
      </main>
    </LegalShell>
  );
}
