// src/app/landing-test/page.tsx

export default function LandingTestPage() {
  const popular = [
    {
      title: "Notion Budget Template",
      tag: "Template",
      rev: "CHF 420 / Monat",
    },
    {
      title: "Lightroom Preset Pack",
      tag: "Preset",
      rev: "CHF 380 / Monat",
    },
    {
      title: "eBook: Freelance Starter",
      tag: "E-Book",
      rev: "CHF 350 / Monat",
    },
    {
      title: "Canva Social Kit",
      tag: "Design",
      rev: "CHF 310 / Monat",
    },
    {
      title: "Mini-Kurs: Newsletter",
      tag: "Kurs",
      rev: "CHF 270 / Monat",
    },
    {
      title: "UI Kit für Figma",
      tag: "UI Kit",
      rev: "CHF 240 / Monat",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* PAGE WRAPPER */}
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 lg:pt-24">
        {/* HERO */}
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Digital Content OS
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              We are a digital marketplace
              <br className="hidden sm:block" /> for creators.
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-600">
              Verkaufe E-Books, Templates, Presets, Kurse und mehr – ohne
              technischen Stress. DigiEmu kümmert sich um Zahlung,
              Auslieferung und Statistik, du konzentrierst dich auf deine
              Inhalte.
            </p>

            {/* HERO BUTTONS */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-slate-900/25 transition hover:-translate-y-[1px] hover:bg-slate-800">
                Verkäufer werden
              </button>

              <button className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-medium text-slate-900 shadow-md shadow-slate-900/10">
                Produkte entdecken
              </button>
            </div>
          </div>

          {/* LIVE DASHBOARD CARD */}
          <div className="mt-4 lg:mt-0">
            <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Live Dashboard (Demo)
              </p>

              <dl className="mt-7 space-y-6 text-sm">
                <div className="flex items-baseline justify-between">
                  <dt className="text-slate-500">Heute</dt>
                  <dd className="text-right">
                    <div className="text-xl font-semibold text-slate-900">
                      CHF 240
                    </div>
                    <div className="text-xs text-slate-500">
                      Direkte Verkäufe
                    </div>
                  </dd>
                </div>

                <div className="flex items-baseline justify-between">
                  <dt className="text-slate-500">Monat</dt>
                  <dd className="text-right">
                    <div className="text-xl font-semibold text-slate-900">
                      CHF 4&apos;320
                    </div>
                    <div className="text-xs text-slate-500">
                      Wiederkehrende Umsätze
                    </div>
                  </dd>
                </div>

                <div className="flex items-baseline justify-between">
                  <dt className="text-slate-500">Creator</dt>
                  <dd className="text-right">
                    <div className="text-xl font-semibold text-slate-900">
                      128
                    </div>
                    <div className="text-xs text-slate-500">
                      Aktive Verkäufer:innen
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* POPULAR PRODUCTS */}
        <section className="mt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Beliebte Produkte
          </p>

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Die meistverkauften digitalen Produkte der letzten 30 Tage.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {popular.map((item) => (
              <article
                key={item.title}
                className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-900/5"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.tag}
                </p>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-6 text-xs font-medium text-slate-600">
                  {item.rev}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* FOOTER TEXT BLOCK */}
        <section className="mt-24 border-t border-slate-200 pt-12">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            DigiEmu – dein Content OS für digitale Produkte
          </h2>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
            DigiEmu ist ein kuratierter Multivendor-Content OS für digitale
            Produkte wie E-Books, Online-Kurse, Templates, Presets, Musik und
            mehr. Creator:innen verkaufen ihre Dateien direkt an Kund:innen,
            während DigiEmu sich um sichere Zahlungen, automatische
            Auslieferung und Reporting kümmert.
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
            Durch eine faire 80/20-Aufteilung, klare Bedingungen und
            transparente Statistiken behalten Creator:innen jederzeit den
            Überblick. DigiEmu reduziert technischen Stress und macht es
            einfach, digitale Produkte professionell zu vertreiben – vom
            ersten Upload bis zur Auszahlung.
          </p>

          <p className="mt-8 text-xs text-slate-400">
            © 2025 DigiEmu – Digital Content OS for Creators
          </p>
        </section>
      </div>
    </main>
  );
}
