import { prisma } from "@/lib/prisma";

/**
 * Recompute counters for ONE vendor (by userId).
 * Source of truth:
 * - sales/revenue/lastSaleAt from Order where downloadLink exists
 * - activeProductsCount from Product where ACTIVE+isActive
 */
export async function recomputeVendorCounters(vendorUserId: string) {
  const [activeProductsCount, salesCount, revenueAgg] = await Promise.all([
    prisma.product.count({
      where: { vendorId: vendorUserId, isActive: true, status: "ACTIVE" },
    }),
    prisma.order.count({
      where: { product: { vendorId: vendorUserId }, downloadLink: { isNot: null } },
    }),
    prisma.order.aggregate({
      where: { product: { vendorId: vendorUserId }, downloadLink: { isNot: null } },
      _sum: { vendorEarningsCents: true },
      _max: { createdAt: true },
    }),
  ]);

  const totalRevenueCents = revenueAgg._sum.vendorEarningsCents ?? 0;
  const lastSaleAt = revenueAgg._max.createdAt ?? null;

  // Ensure VendorProfile exists (tenant-scoped). Use DEFAULT tenant when no tenant context is available.
  const tenantKey = process.env.DEFAULT_TENANT_KEY || "DEFAULT";
  const vp = await prisma.vendorProfile.upsert({
    where: { tenantKey_userId: { tenantKey, userId: vendorUserId } as any },
    create: { userId: vendorUserId, tenantKey },
    update: {},
    select: { id: true, userId: true },
  });

  await prisma.vendorProfile.update({
    where: { id: vp.id },
    data: {
      totalSales: salesCount,
      totalRevenueCents,
      activeProductsCount,
      lastSaleAt,
    },
  });

  return { totalSales: salesCount, totalRevenueCents, activeProductsCount, lastSaleAt };
}
