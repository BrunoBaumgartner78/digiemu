

import dynamic from "next/dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const RevenueOverTimeChart = dynamic(() => import("@/components/admin/analytics/RevenueOverTimeChart"), { ssr: false });
const TopProductsBarChart = dynamic(() => import("@/components/admin/analytics/TopProductsBarChart"), { ssr: false });

export const metadata = {
  title: "Admin Analytics – DigiEmu",
  description: "Umsatz- und Bestell-Analytics für Admins.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

function parseDaysParam(searchParams?: SearchParams): number | null {
  const days = searchParams?.days;
  if (days === "7" || days === "30" || days === "90") return parseInt(days);
  return null;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams?: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="neumorph-card max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Kein Zugriff</h1>
          <p className="mb-4">Nur Admins dürfen diese Seite sehen.</p>
          <Link href="/" className="neobtn">Zur Startseite</Link>
        </div>
      </main>
    );
  }

  // Date filter
  const days = parseDaysParam(searchParams);
  let fromDate: Date | undefined = undefined;
  if (days) {
    fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - days + 1);
  }

  // Orders laden (filtered)
  const orders = await prisma.order.findMany({
    where: fromDate ? { createdAt: { gte: fromDate } } : {},
    include: { product: true, buyer: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });


  // KPIs & Aggregationen
  const completedOrders = orders.filter(o => o.status === "COMPLETED");
  const totalOrders = orders.length;
  const totalRevenueCents = completedOrders.reduce((sum, o) => sum + o.amountCents, 0);
  const totalBuyers = new Set(orders.map(o => o.buyerId)).size;
  const avgRevenuePerOrder = totalOrders > 0 ? totalRevenueCents / totalOrders : 0;

  // Top-Produkte Aggregation (for table and chart)
  const productMap = new Map<string, { title: string; count: number; revenueCents: number }>();
  for (const order of completedOrders) {
    if (!order.product) continue;
    const key = order.product.id;
    if (!productMap.has(key)) {
      productMap.set(key, { title: order.product.title, count: 0, revenueCents: 0 });
    }
    const entry = productMap.get(key)!;
    entry.count += 1;
    entry.revenueCents += order.amountCents;
  }
  const topProducts = Array.from(productMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  // Chart data: Revenue over time (per day)
  const revenueByDate = new Map<string, { revenueCents: number; orders: number }>();
  for (const order of completedOrders) {
    const date = order.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!revenueByDate.has(date)) {
      revenueByDate.set(date, { revenueCents: 0, orders: 0 });
    }
    const entry = revenueByDate.get(date)!;
    entry.revenueCents += order.amountCents;
    entry.orders += 1;
  }
  const revenueOverTimeData = Array.from(revenueByDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Chart data: Top products for bar chart
  const topProductsBarData = topProducts.map(p => ({
    productTitle: p.title,
    totalRevenueCents: p.revenueCents,
    totalCount: p.count,
  }));

  // Helper for filter bar
  const filterOptions = [
    { label: "7 Tage", value: "7" },
    { label: "30 Tage", value: "30" },
    { label: "90 Tage", value: "90" },
    { label: "Alle", value: undefined },
  ];
  const activeDays = days ? String(days) : undefined;

  return (
    <main className="page-shell-wide py-8 px-2 md:px-8">
      <header className="section-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Analytics</h1>
        <p className="text-muted text-sm">Umsatz- und Bestellübersicht für DigiEmu.</p>
      </header>
      {/* Filter Bar + CSV Export */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="flex gap-2">
          {filterOptions.map(opt => (
            <Link
              key={opt.label}
              href={opt.value ? `/admin/analytics?days=${opt.value}` : "/admin/analytics"}
              className={`neobtn-sm${activeDays === opt.value ? " primary" : ""}`}
              style={activeDays === opt.value ? { opacity: 1 } : { opacity: 0.7 }}
            >
              {opt.label}
            </Link>
          ))}
        </div>
        <Link
          href={activeDays ? `/api/admin/orders/export?days=${activeDays}` : "/api/admin/orders/export"}
          className="neobtn-sm ml-auto flex items-center gap-1"
          style={{ minWidth: 140 }}
        >
          <span role="img" aria-label="CSV">📄</span> CSV exportieren
        </Link>
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="neumorph-card p-5 text-center">
          <div className="text-xs text-muted mb-1">Gesamtumsatz</div>
          <div className="text-xl font-bold">
            {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(totalRevenueCents / 100)}
          </div>
        </div>
        <div className="neumorph-card p-5 text-center">
          <div className="text-xs text-muted mb-1">Bestellungen</div>
          <div className="text-xl font-bold">{totalOrders}</div>
        </div>
        <div className="neumorph-card p-5 text-center">
          <div className="text-xs text-muted mb-1">Käufer</div>
          <div className="text-xl font-bold">{totalBuyers}</div>
        </div>
        <div className="neumorph-card p-5 text-center">
          <div className="text-xs text-muted mb-1">Ø Umsatz/Order</div>
          <div className="text-xl font-bold">
            {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(avgRevenuePerOrder / 100)}
          </div>
        </div>
      </div>
      {/* Verlauf & Verteilung (Charts) */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="neumorph-card p-4 md:p-6">
            <h2 className="font-semibold text-lg mb-4">Umsatzverlauf</h2>
            {revenueOverTimeData.length === 0 ? (
              <div className="text-muted text-center py-8">Keine Bestellungen im ausgewählten Zeitraum.</div>
            ) : (
              <RevenueOverTimeChart data={revenueOverTimeData} />
            )}
          </div>
          <div className="neumorph-card p-4 md:p-6">
            <h2 className="font-semibold text-lg mb-4">Top Produkte (Chart)</h2>
            {topProductsBarData.length === 0 ? (
              <div className="text-muted text-center py-8">Keine Verkäufe im ausgewählten Zeitraum.</div>
            ) : (
              <TopProductsBarChart data={topProductsBarData} />
            )}
          </div>
        </div>
      </section>
      {/* Top-Produkte Card (Tabelle) */}
      <div className="neumorph-card p-4 md:p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Top Produkte</h2>
        {topProducts.length === 0 ? (
          <div className="text-muted text-center py-6">Noch keine Verkäufe vorhanden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Produkt</th>
                  <th className="py-2 pr-4">Verkäufe</th>
                  <th className="py-2 pr-4">Umsatz</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((prod, idx) => (
                  <tr key={prod.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono">{idx + 1}</td>
                    <td className="py-2 pr-4">{prod.title}</td>
                    <td className="py-2 pr-4">{prod.count}</td>
                    <td className="py-2 pr-4">
                      {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(prod.revenueCents / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Orders Table */}
      <div className="neumorph-card p-4 md:p-6">
        <h2 className="font-semibold text-lg mb-4">Letzte Bestellungen</h2>
        {orders.length === 0 ? (
          <div className="text-muted text-center py-8">Noch keine Bestellungen vorhanden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-2 pr-4">Datum</th>
                  <th className="py-2 pr-4">Produkt</th>
                  <th className="py-2 pr-4">Käufer</th>
                  <th className="py-2 pr-4">Betrag</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('de-CH')}</td>
                    <td className="py-2 pr-4">{order.product?.title ?? '–'}</td>
                    <td className="py-2 pr-4">{order.buyer?.email ?? '–'}</td>
                    <td className="py-2 pr-4">
                      {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(order.amountCents / 100)}
                    </td>
                    <td className="py-2 pr-4">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
