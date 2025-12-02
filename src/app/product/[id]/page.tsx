import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

type Params = { params: Promise<{ id: string }> };

// -------- METADATA --------
export async function generateMetadata(
  { params }: Params
): Promise<Metadata> {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: product ? `${product.title} | DigiEmu` : "Produkt nicht gefunden",
  };
}

// -------- PAGE --------
export default async function ProductDetailPage({ params }: Params) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { vendor: true },
  });

  if (!product) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl bg-white/80 shadow-lg shadow-slate-200/80 px-8 py-10 text-center backdrop-blur-sm">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Produkt nicht gefunden
          </h1>
          <p className="text-slate-500 mb-6">
            Das angeforderte Produkt existiert nicht oder wurde entfernt.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow-md shadow-slate-400/60 hover:bg-slate-800 transition"
          >
            Zurück zum Marktplatz
          </Link>
        </div>
      </main>
    );
  }

  const price = ((product as any).priceCents ?? 0) / 100;
  const vendorEmail = (product as any).vendor?.email ?? "Unbekannter Verkäufer";

  return (
    <main className="min-h-[70vh] w-full flex justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        {/* Breadcrumb / Back */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/marketplace"
            className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
          >
            ← Zurück zum Marktplatz
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          {/* Bild-Card */}
          <section className="rounded-3xl bg-white/80 shadow-lg shadow-slate-200/80 p-5 backdrop-blur-sm">
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3] flex items-center justify-center">
              {product.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    width="160"
                    height="120"
                    className="opacity-40 text-slate-400"
                  >
                    <rect
                      x="6"
                      y="6"
                      width="148"
                      height="108"
                      rx="14"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                    />
                    <circle
                      cx="112"
                      cy="34"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      d="M32 94 L70 46 L118 94 Z"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </div>
          </section>

          {/* Info-Card */}
          <section className="rounded-3xl bg-white/90 shadow-lg shadow-slate-200/80 p-6 md:p-7 backdrop-blur-sm flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-1">
                  {product.title}
                </h1>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Digitales Produkt
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-slate-400/50">
                  {price.toFixed(2)} CHF
                </span>
                <span className="text-[11px] text-slate-400">
                  inkl. MwSt. / Sofort-Download
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-1">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1.5">
                Beschreibung
              </h2>
              <p className="text-sm leading-relaxed text-slate-700">
                {product.description || "Für dieses Produkt wurde noch keine Beschreibung hinterlegt."}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Verkäufer
              </h3>
              <p className="text-sm text-slate-700">{vendorEmail}</p>
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow-md shadow-slate-400/60 hover:bg-slate-800 transition"
              >
                Jetzt kaufen (Demo)
              </button>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition"
              >
                Weitere Produkte ansehen
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
