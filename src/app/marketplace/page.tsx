// src/app/marketplace/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MarketplacePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const count = products.length;

  return (
    <main className="min-h-[70vh] w-full flex justify-center px-4 py-10">
      <div className="w-full max-w-6xl space-y-8">
        {/* Hero / Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">
              DigiEmu · Marktplatz
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">
              Digitale Produkte entdecken
            </h1>
            <p className="text-sm md:text-base text-slate-500 max-w-xl">
              E-Books, Assets &amp; Ressourcen von unabhängigen Creators –
              sofort als Download verfügbar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-md shadow-slate-400/60">
              {count} {count === 1 ? "Produkt" : "Produkte"}
            </div>
          </div>
        </header>

        {/* Optional: kleine Filter- / Info-Leiste (nur UI, noch ohne Logik) */}
        <section className="neo-pill-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-slate-500 backdrop-blur">
          <span>
            Zeigt{" "}
            <strong className="font-semibold text-slate-800">
              {count}
            </strong>{" "}
            aktive Produkte.
          </span>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 font-medium text-[11px] text-slate-500 border border-slate-100">
              Sortierung: Neueste zuerst
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 font-medium text-[11px] text-slate-500 border border-slate-100">
              Kategorien: alle
            </span>
          </div>
        </section>

        {/* Inhalt */}
        {count === 0 ? (
          <section className="flex justify-center">
            <div className="neo-card w-full max-w-md border border-dashed px-8 py-10 text-center text-slate-500 backdrop-blur-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-800">
                Noch keine Produkte
              </h2>
              <p className="text-sm mb-4">
                Sobald Verkäufer ihre ersten digitalen Produkte hochladen,
                erscheinen sie hier im Marktplatz.
              </p>
              <p className="text-[11px] text-slate-400">
                (Debug: count = {count})
              </p>
            </div>
          </section>
        ) : (
          <section>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const priceCents = (p as any).priceCents ?? 0;
                const price = priceCents / 100;
                const thumbnail = p.thumbnail || "/product-placeholder.png";
                const category =
                  (p as any).category && (p as any).category.trim().length > 0
                    ? (p as any).category
                    : "Allgemein";

                return (
                  <article
                    key={p.id}
                    className="group flex flex-col neo-card p-4 backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                  >
                    {/* Bild */}
                    <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnail}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-900/5" />
                    </div>

                    {/* Kategorie */}
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 border border-slate-100">
                        {category}
                      </span>
                    </div>

                    {/* Titel & Beschreibung */}
                    <h2 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900">
                      {p.title}
                    </h2>

                    {p.description && (
                      <p className="mb-3 line-clamp-3 text-xs text-slate-500">
                        {p.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {price.toFixed(2)} CHF
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Sofort-Download
                        </span>
                      </div>
                      <Link
                        href={`/product/${p.id}`}
                        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm shadow-slate-400/50 hover:bg-slate-800 transition"
                      >
                        Details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
