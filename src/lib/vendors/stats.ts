import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export type SellerStats = {
  activeProducts: number;
  totalSales: number;
  totalRevenueCents: number;
};

export async function getSellerStats(params: {
  tenantKey: string;
  vendorProfileId: string;
}): Promise<SellerStats> {
  const { tenantKey, vendorProfileId } = params;

  // 1) active products for this profile
  const activeProducts = await prisma.product.count({
    where: {
      tenantKey,
      vendorProfileId,
      isActive: true,
      status: { in: [ProductStatus.ACTIVE, ProductStatus.PUBLISHED] },
    },
  });

  // 2) real sales from orders
  const salesAgg = await prisma.order.aggregate({
    where: {
      tenantKey,
      product: {
        vendorProfileId,
        tenantKey,
      },
      status: { in: ["PAID", "SUCCEEDED", "COMPLETED"] },
    },
    _count: { _all: true },
    _sum: { amountCents: true },
  });

  return {
    activeProducts,
    totalSales: Number(salesAgg._count._all ?? 0),
    totalRevenueCents: Number(salesAgg._sum.amountCents ?? 0),
  };
}

export function formatCHF(cents: number) {
  const v = (cents / 100).toFixed(2);
  return `CHF ${v}`;
}

export default getSellerStats;
