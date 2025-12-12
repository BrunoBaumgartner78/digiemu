// src/lib/landingStats.ts
import { prisma } from "@/lib/prisma";
import { startOfToday, startOfMonth, subDays } from "date-fns";

export type LandingStats = {
  todayTotal: number;
  monthTotal: number;
  activeCreators: number;
};

export type TopProduct = {
  id: string;
  title: string;
  type: string; // Anzeige-Label (z.B. "E-Book", "Template")
  monthlyRevenue: number;
};

export async function getLandingStats(): Promise<LandingStats> {
  const now = new Date();
  const todayStart = startOfToday();
  const monthStart = startOfMonth(now);

  const [todayAgg, monthAgg, activeOrders] = await Promise.all([
    // HEUTE – aktuell ohne Status-Filter, damit auf jeden Fall Zahlen kommen
    prisma.order.aggregate({
      _sum: { amountCents: true },
      where: {
        createdAt: { gte: todayStart },
      },
    }),

    // MONAT – ebenfalls ohne Status-Filter
    prisma.order.aggregate({
      _sum: { amountCents: true },
      where: {
        createdAt: { gte: monthStart },
      },
    }),

    prisma.order.findMany({
      where: {
        createdAt: { gte: monthStart },
      },
      select: {
        product: {
          select: {
            vendorId: true,
          },
        },
      },
    }),
  ]);

  const vendorIdSet = new Set<string>();
  for (const o of activeOrders) {
    const vid = o.product?.vendorId;
    if (vid) vendorIdSet.add(vid);
  }

  return {
    todayTotal: (todayAgg._sum.amountCents ?? 0) / 100,
    monthTotal: (monthAgg._sum.amountCents ?? 0) / 100,
    activeCreators: vendorIdSet.size,
  };
}

export async function getTopProducts(limit = 3): Promise<TopProduct[]> {
  const since = subDays(new Date(), 30);

  const grouped = await prisma.order.groupBy({
    by: ["productId"],
    where: {
      createdAt: { gte: since },
      // kein status-Filter, damit wir sicher Daten sehen
    },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: "desc" } },
    take: limit,
  });

  const productIds = grouped.map((g) => g.productId);
  if (productIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      title: true,
      category: true, // das gibt es sicher laut Fehlermeldung
    },
  });

  const revenueById = new Map(
    grouped.map((g) => [g.productId, (g._sum.amountCents ?? 0) / 100])
  );

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    // Anzeige-Label aus category ableiten, Fallback "Produkt"
    type: p.category ?? "Produkt",
    monthlyRevenue: revenueById.get(p.id) ?? 0,
  }));
}
