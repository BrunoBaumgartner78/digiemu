// src/app/admin/analytics/page.tsx
import { requireAdminPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminAnalyticsClient from "./AdminAnalyticsClient";
import type { RevenuePoint, TopProductPoint } from "./AdminAnalyticsClient";

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

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await requireAdminPage();

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="neumorph-card max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Kein Zugriff</h1>
          <p className="mb-4">Nur Admins dürfen diese Seite sehen.</p>
          <Link href="/" className="neobtn">
            Zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  const days = parseDaysParam(searchParams);
  let fromDate: Date | undefined;

  if (days) {
    fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - days + 1);
  }

  const orders = await prisma.order.findMany({
    where: fromDate ? { createdAt: { gte: fromDate } } : {},
    include: { product: true },
  });

  const completed = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "PAID"
  );

  // Revenue over time
  const byDay = new Map<string, { revenueCents: number; orders: number }>();
  for (const o of completed) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { revenueCents: 0, orders: 0 };
    cur.revenueCents += o.amountCents;
    cur.orders += 1;
    byDay.set(key, cur);
  }

  const revenueOverTime: RevenuePoint[] = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, revenueCents: v.revenueCents, orders: v.orders }));

  // Top products
  const byProduct = new Map<string, { title: string; revenueCents: number; orders: number }>();
  for (const o of completed) {
    const id = o.productId;
    const title = o.product?.title ?? "Produkt";
    const cur = byProduct.get(id) ?? { title, revenueCents: 0, orders: 0 };
    cur.revenueCents += o.amountCents;
    cur.orders += 1;
    byProduct.set(id, cur);
  }

  const topProducts: TopProductPoint[] = Array.from(byProduct.entries())
    .map(([productId, v]) => ({ productId, title: v.title, revenueCents: v.revenueCents, orders: v.orders }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);

  return <AdminAnalyticsClient revenueOverTime={revenueOverTime} topProducts={topProducts} />;
}
