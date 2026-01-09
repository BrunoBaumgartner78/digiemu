export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="page-shell" style={{ paddingTop: 14 }}>
      <section className="neo-card" style={{ padding: 22 }}>
        <h1 style={{ marginTop: 0, marginBottom: 10, fontSize: 28, fontWeight: 950 }}>
          Nutzungsbedingungen (MVP)
        </h1>

        <p style={{ opacity: 0.85, lineHeight: 1.75 }}>
          DigiEmu ist ein Content OS für digitale Produkte. Verkäufer stellen Inhalte bereit,
          Käufer erwerben Nutzungsrechte bzw. Downloads gemäss Produktbeschreibung.
        </p>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 18, fontWeight: 900 }}>
          Digitale Inhalte & Lieferung
        </h2>
        <p style={{ opacity: 0.85, lineHeight: 1.75 }}>
          Nach erfolgreicher Zahlung wird ein Download-Link bereitgestellt. Der Link kann zeitlich begrenzt
          sein und eine maximale Anzahl Downloads haben (siehe Download-Seite).
        </p>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 18, fontWeight: 900 }}>
          Widerruf / Rückgabe (Digital)
        </h2>
        <p style={{ opacity: 0.85, lineHeight: 1.75 }}>
          Bei digitalen Inhalten kann das Widerrufs-/Rückgaberecht eingeschränkt sein, sobald die
          Bereitstellung/der Download begonnen hat. Vor dem Kauf bestätigen Käufer ausdrücklich,
          dass mit der Ausführung sofort begonnen wird.
        </p>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 18, fontWeight: 900 }}>
          Support & Kontakt
        </h2>
        <p style={{ opacity: 0.85, lineHeight: 1.75 }}>
          Bei technischen Problemen (Download/Account) hilft der Support über die Hilfe-Seite.
        </p>

        <p style={{ marginTop: 16, opacity: 0.65 }}>
          Hinweis: Diese Bedingungen sind eine MVP-Version und werden bei Bedarf ergänzt.
        </p>
      </section>
    </main>
  );
}
