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
