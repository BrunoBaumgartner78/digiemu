"use client";
import useSWR from "swr";
import ProductStatsTable, { ProductStat } from "@/components/vendor/stats/ProductStatsTable";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function VendorProductStatsPage() {
  const { data, error, isLoading } = useSWR<ProductStat[]>("/api/vendor/products/stats", fetcher, { refreshInterval: 60000 });

  return (
    <main className="page-shell-wide py-8 px-2 md:px-8">
      <header className="section-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Produkt-Performance</h1>
        <p className="text-muted text-sm">Alle Statistiken zu deinen Produkten: Verkäufe, Umsatz, Views und Conversion.</p>
      </header>
      {error ? (
        <div className="neumorph-card p-8 text-center text-red-500">Fehler beim Laden der Statistiken.</div>
      ) : isLoading ? (
        <div className="neumorph-card p-8 text-center text-muted">Lade Statistiken…</div>
      ) : (
        <ProductStatsTable stats={data ?? []} />
      )}
    </main>
  );
}
