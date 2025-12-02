import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "VENDOR") {
    redirect("/dashboard");
  }
  const vendorId = session.user.id;
  // Fetch all products for vendor
  const products = await prisma.product.findMany({
    where: { vendorId },
    include: { orders: true },
  });
  // Aggregate earnings
  const allOrders = products.flatMap((p) => p.orders);
  const totalEarnings = allOrders.reduce((sum, o) => sum + o.amountCents, 0);
  const last30dOrders = allOrders.filter((o) => new Date(o.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const earningsLast30d = last30dOrders.reduce((sum, o) => sum + o.amountCents, 0);
  const avgPerDay = earningsLast30d / 30;
  const avgPerProduct = products.length ? totalEarnings / products.length : 0;

  // Earnings by day (for chart)
  // TODO: Replace with actual daily aggregation if needed
  const earningsByDay: { date: string; amount: number }[] = [];
  // TODO: Fill earningsByDay with daily sums

  // Earnings by product
  const earningsByProduct = products.map((p) => ({
    title: p.title,
    downloadsCount: p.orders.length,
    revenue: p.orders.reduce((sum, o) => sum + o.amountCents, 0),
    vendorShare: 0, // TODO: calculate vendor share
    platformShare: 0, // TODO: calculate platform share
  }));

  return (
    <main className="min-h-[70vh] w-full flex justify-center px-4 py-10 bg-gradient-to-br from-[#edf2ff] to-[#f8f9ff]">
      <div className="w-full max-w-5xl space-y-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Einnahmen</h1>
          <p className="text-xs text-slate-500">Verlauf, Produkte & Provisionsaufteilung</p>
          <Link href="/dashboard" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition mt-2">Zurück zum Dashboard</Link>
        </header>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white/90 shadow-lg shadow-slate-200/80 p-6 backdrop-blur-sm flex flex-col lg:col-span-2">
            <div className="font-medium text-slate-700 mb-2">Einnahmenverlauf</div>
            {/* TODO: Render chart with earningsByDay */}
            <div className="h-56 flex items-center justify-center text-slate-400">Chart folgt</div>
          </div>
          <div className="rounded-3xl bg-white/90 shadow-lg shadow-slate-200/80 p-6 backdrop-blur-sm flex flex-col lg:col-span-1">
            <div className="font-medium text-slate-700 mb-2">Zusammenfassung</div>
            <div className="space-y-2">
              <div>Gesamteinnahmen: <span className="font-bold">{(totalEarnings / 100).toFixed(2)} CHF</span></div>
              <div>Letzte 30 Tage: <span className="font-bold">{(earningsLast30d / 100).toFixed(2)} CHF</span></div>
              <div>Durchschnitt / Tag: <span className="font-bold">{(avgPerDay / 100).toFixed(2)} CHF</span></div>
              <div>Durchschnitt / Produkt: <span className="font-bold">{(avgPerProduct / 100).toFixed(2)} CHF</span></div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white/90 shadow-lg shadow-slate-200/80 p-6 backdrop-blur-sm mt-8">
          <div className="font-medium text-slate-700 mb-2">Einnahmen nach Produkt</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Produkt</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Downloads</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Umsatz</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Anteil Verkäufer</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Anteil Plattform</th>
                </tr>
              </thead>
              <tbody>
                {earningsByProduct.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <span className="text-2xl">📊</span>
                      <span className="font-semibold">Noch keine Verkäufe</span>
                      <span className="text-xs">Sobald Produkte verkauft werden, erscheinen sie hier.</span>
                    </td>
                  </tr>
                ) : (
                  earningsByProduct.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-medium text-slate-900">{row.title}</td>
                      <td className="py-2 px-3">{row.downloadsCount}</td>
                      <td className="py-2 px-3">{(row.revenue / 100).toFixed(2)} CHF</td>
                      <td className="py-2 px-3">{/* TODO: vendorShare */}</td>
                      <td className="py-2 px-3">{/* TODO: platformShare */}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
