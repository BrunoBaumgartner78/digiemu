// src/lib/landingStats.ts
import { prisma } from "@/lib/prisma";

export type LandingStats = {
  totalProducts: number;
  totalOrders: number;
  totalVendors: number;
  topProducts: Array<{
    productId: string;
    title: string;
    vendorId: string;
    orderCount: number;
    revenueCents: number;
  }>;
};

export async function getLandingStats(): Promise<LandingStats> {
  // Basiszahlen
  const [totalProducts, totalOrders, totalVendors] = await Promise.all([
    prisma.product.count({ where: { isActive: true, status: "ACTIVE" } }),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.vendorProfile.count({ where: { status: "APPROVED" } }),
  ]);

  // Top-Produkte nach Bestellungen (Order -> Product)
  // ✅ vendorId kommt über product.vendorId (nicht order.vendorId!)
  const top = await prisma.order.groupBy({
    by: ["productId"],
    where: { status: "paid" },
    _count: { productId: true },
    _sum: { amountCents: true },
    orderBy: { _count: { productId: "desc" } },
    take: 10,
  });

  const productIds = top.map((x) => x.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      title: true,
      vendorId: true, // ✅ hier ist vendorId korrekt
    },
  });

  const byId = new Map(products.map((p) => [(p as any).id, p as any]));

  const topProducts = top
    .map((g) => {
      const p = byId.get(g.productId) as any | undefined;
      if (!p) return null;

      return {
        productId: p.id,
        title: p.title,
        vendorId: p.vendorId,
        orderCount: g._count?.productId ?? 0,
        revenueCents: g._sum?.amountCents ?? 0,
      };
    })
    .filter(Boolean) as LandingStats["topProducts"];

  return {
    totalProducts,
    totalOrders,
    totalVendors,
    topProducts,
  };
}
