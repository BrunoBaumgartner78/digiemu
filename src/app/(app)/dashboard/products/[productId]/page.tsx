// src/app/product/[id]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// ⬅️ WICHTIG: params ist jetzt ein Promise in Next.js 16
type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Sichere Helper-Funktion
async function safeFindProductById(id: string) {
  try {
    // Prisma-Aufruf sehr simpel halten
    const product = await prisma.product.findUnique({
      where: { id },
    });
    return product;
  } catch (_err) {
    console.error("[safeFindProductById] Prisma-Fehler:", err);
    return null;
  }
}

// ---------- SEO / Metadata ----------

export async function generateMetadata(
  props: ProductPageProps
): Promise<Metadata> {
  // ⬅️ params muss awaited werden
  const { id } = await props.params;

  const product = await safeFindProductById(id);

  if (!product) {
    return {
      title: "Produkt nicht gefunden | DigiEmu",
      description: "Dieses Produkt existiert nicht (mehr).",
    };
  }

  return {
    title: `${product.title} | DigiEmu`,
    description: product.description ?? "Digitales Produkt auf DigiEmu.",
  };
}

// ---------- Seite ----------

export default async function ProductPage(props: ProductPageProps) {
  // ⬅️ hier auch: params awaiten
  const { id } = await props.params;

  const product = await safeFindProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/marketplace"
          className="inline-flex text-sm text-slate-300 hover:text-white"
        >
          ← Zurück zum Marktplatz
        </Link>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/60">
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr] items-start">
            {/* Bild */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              {product.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-500 text-sm">
                  Kein Vorschaubild
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {product.title}
              </h1>

              <p className="text-sm text-slate-400">
                Kategorie:{" "}
                <span className="font-medium text-slate-200">
                  {product.category ?? "uncategorized"}
                </span>
              </p>

              <p className="text-lg font-semibold text-emerald-300">
                {(product.priceCents / 100).toFixed(2)} CHF
              </p>

              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-line">
                {product.description}
              </p>

              <div className="pt-2">
                <Link
                  href={`/checkout/${product.id}`}
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_0_1px_rgba(15,23,42,0.9)] hover:shadow-[0_0_24px_rgba(16,185,129,0.5)] transition-shadow"
                >
                  Jetzt kaufen &amp; downloaden
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Debug-Infos – später gern löschen */}
        <section className="text-xs text-slate-500 space-y-1">
          <div>Produkt-ID: {product.id}</div>
          <div>Vendor-ID: {product.vendorId}</div>
        </section>
      </div>
    </main>
  );
}
