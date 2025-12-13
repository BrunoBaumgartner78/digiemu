"use client";
import RevenueOverTimeChart from "@/components/admin/analytics/RevenueOverTimeChart";
import TopProductsBarChart from "@/components/admin/analytics/TopProductsBarChart";

export type RevenuePoint = { date: string; revenueCents: number; orders: number };
export type TopProductPoint = { productId: string; title: string; revenueCents: number; orders: number };

type Props = {
  revenueOverTime: RevenuePoint[];
  topProducts: TopProductPoint[];
};

export default function AdminAnalyticsClient({ revenueOverTime, topProducts }: Props) {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="neumorph-card p-4 md:p-6">
          <h2 className="text-lg font-bold mb-4">Umsatz über Zeit</h2>
          <RevenueOverTimeChart data={revenueOverTime} />
        </section>

        <section className="neumorph-card p-4 md:p-6">
          <h2 className="text-lg font-bold mb-4">Top Produkte</h2>
          <TopProductsBarChart data={topProducts} />
        </section>
      </div>
    </main>
  );
}
            <p className="text-sm opacity-70">Bestellungen</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
          <div className="neumorph-card p-5">
            <p className="text-sm opacity-70">Umsatz (paid/completed)</p>
            <p className="text-2xl font-bold">
              CHF {(totalRevenueCents / 100).toFixed(2)}
            </p>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="neumorph-card p-4">
            <RevenueOverTimeChart />
          </div>
          <div className="neumorph-card p-4">
            <TopProductsBarChart />
          </div>
        </section>

        <section className="neumorph-card p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-3">Letzte Bestellungen</h2>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-xs uppercase opacity-60 border-b">
                <th className="py-2 text-left">Produkt</th>
                <th className="py-2 text-left">Buyer</th>
                <th className="py-2 text-left">Datum</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-none">
                  <td className="py-3 font-semibold">{o.productTitle}</td>
                  <td className="py-3 opacity-80">{o.buyerEmail ?? "—"}</td>
                  <td className="py-3">
                    {new Date(o.createdAt).toLocaleDateString("de-CH")}
                  </td>
                  <td className="py-3">{o.status}</td>
                  <td className="py-3">
                    CHF {(o.amountCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="py-4 opacity-70" colSpan={5}>
                    Keine Bestellungen im Zeitraum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
