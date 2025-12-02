import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // KPIs
  const [totalRevenue, revenueLast30d, vendorCount, newVendorsLast30d, productCount, activeProductsCount, downloadCount, downloadsToday] = await Promise.all([
    prisma.order.aggregate({ _sum: { amountCents: true } }),
    prisma.order.aggregate({
      _sum: { amountCents: true },
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.count({ where: { role: "VENDOR" } }),
    prisma.user.count({
      where: {
        role: "VENDOR",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.product.count(),
    // TODO: Switch to Product.status after migration. Fallback to isActive for now.
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
  ]);

  // Revenue by day (for chart)
  // TODO: Replace with actual daily aggregation
  const revenueByDay: { date: string; amount: number }[] = [];

  // Revenue by vendor (for pie chart)
  // TODO: Replace with actual aggregation
  const revenueByVendor: { vendorName: string; amount: number }[] = [];

  // Top products
  const topProducts = await prisma.product.findMany({
    orderBy: [{ orders: { _count: "desc" } }],
    take: 7,
    include: {
      vendor: true,
      orders: true,
    },
  });

  // Recent activity
  // TODO: Implement recent activity log aggregation
  const recentActivity: { message: string; createdAt: Date }[] = [];

  return (
    <main className="min-h-[80vh] w-full flex justify-center px-4 py-10 bg-[var(--bg)]">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--text-main)]">Admin Dashboard</h1>
          <p className="text-xs text-[var(--text-muted)]">Überblick über Umsätze, Verkäufer, Produkte & Downloads</p>
          <div className="flex gap-2 mt-2">
            <Link href="/admin/products" className="neo-btn neo-btn-secondary">Produkte</Link>
            <Link href="/admin/downloads" className="neo-btn neo-btn-secondary">Downloads</Link>
            <Link href="/admin/payouts" className="neo-btn neo-btn-secondary">Auszahlungen</Link>
          </div>
        </header>
        {/* KPI Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="neo-pill-card p-6">
            <div className="font-medium text-[var(--text-main)] mb-1">Gesamtumsatz</div>
            <div className="text-xl font-bold text-[var(--text-main)]">{((totalRevenue._sum.amountCents ?? 0) / 100).toFixed(2)} CHF</div>
            <div className="text-xs text-[var(--text-muted)]">Letzte 30 Tage: {((revenueLast30d._sum.amountCents ?? 0) / 100).toFixed(2)} CHF</div>
          </div>
          <div className="neo-pill-card p-6">
            <div className="font-medium text-[var(--text-main)] mb-1">Verkäufer gesamt</div>
            <div className="text-xl font-bold text-[var(--text-main)]">{vendorCount}</div>
            <div className="text-xs text-[var(--text-muted)]">Neu (30d): {newVendorsLast30d}</div>
          </div>
          <div className="neo-pill-card p-6">
            <div className="font-medium text-[var(--text-main)] mb-1">Produkte gesamt</div>
            <div className="text-xl font-bold text-[var(--text-main)]">{productCount}</div>
            <div className="text-xs text-[var(--text-muted)]">Aktiv: {activeProductsCount}</div>
          </div>
          <div className="neo-pill-card p-6">
            <div className="font-medium text-[var(--text-main)] mb-1">Downloads gesamt</div>
            <div className="text-xl font-bold text-[var(--text-main)]">{downloadCount}</div>
            <div className="text-xs text-[var(--text-muted)]">Heute: {downloadsToday}</div>
          </div>
        </section>
        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="neo-card p-6 lg:col-span-2">
            <div className="font-medium text-[var(--text-main)] mb-2">Umsatzverlauf</div>
            {/* TODO: Render revenueByDay line chart */}
            <div className="h-56 flex items-center justify-center text-[var(--text-muted)]">Chart folgt</div>
          </div>
          <div className="neo-card p-6 lg:col-span-1">
            <div className="font-medium text-[var(--text-main)] mb-2">Umsatz nach Verkäufer</div>
            {/* TODO: Render revenueByVendor pie chart */}
            <div className="h-56 flex items-center justify-center text-slate-400">Chart folgt</div>
          </div>
        </section>
        {/* Lower Row: Top-Produkte & Systemaktivität */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="neo-card p-6">
            <div className="font-medium text-slate-700 mb-2">Top Produkte</div>
            <ul className="divide-y divide-slate-100">
              {topProducts.map((p) => (
                <li key={p.id} className="py-3 flex flex-col gap-1">
                  <div className="font-semibold text-slate-900">{p.title}</div>
                  <div className="text-xs text-slate-500">{p.vendor?.name ?? "Unbekannter Verkäufer"}</div>
                  <div className="flex gap-4 text-xs mt-1">
                    <span className="bg-slate-50 rounded px-2 py-0.5">Downloads: {p.orders.length}</span>
                    <span className="bg-slate-50 rounded px-2 py-0.5">Umsatz: {((p.orders.reduce((sum, o) => sum + o.amountCents, 0)) / 100).toFixed(2)} CHF</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-right">
              <Link href="/admin/products" className="text-indigo-500 hover:underline">Alle Produkte</Link>
            </div>
          </div>
          <div className="neo-card p-6">
            <div className="font-medium text-slate-700 mb-2">Letzte Aktivitäten</div>
            {/* TODO: Render recentActivity list */}
            <div className="h-32 flex items-center justify-center text-slate-400">Aktivitätslog folgt</div>
          </div>
        </section>
      </div>
    </main>
  );
}
