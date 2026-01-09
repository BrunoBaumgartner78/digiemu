import { prisma } from "@/lib/prisma";

/**
 * Vendor Stats (MVP-safe)
 * - Sales are derived from Orders (and optionally only those with DownloadLink).
 * - Revenue uses vendorEarningsCents (already computed in webhook).
 */
export async function getVendorStatsByUserId(vendorUserId: string) {
  // Active products (public/active)
  const activeProductsCount = await prisma.product.count({
    where: {
      vendorId: vendorUserId,
      isActive: true,
      status: "ACTIVE",
    },
  });

  // Count orders for vendor where a DownloadLink exists (treat as completed sale)
  const totalSales = await prisma.order.count({
    where: {
      product: { vendorId: vendorUserId },
      downloadLink: { isNot: null },
    },
  });

  // Revenue sum (vendor share) and last sale time
  const agg = await prisma.order.aggregate({
    where: {
      product: { vendorId: vendorUserId },
      downloadLink: { isNot: null },
    },
    _sum: { vendorEarningsCents: true },
    _max: { createdAt: true },
  });

  const revenueCents = agg._sum.vendorEarningsCents ?? 0;
  const lastSaleAt = agg._max.createdAt ?? null;

  return {
    totalSales,
    revenueCents,
    lastSaleAt,
    activeProductsCount,
    mode: "order+downloadLink",
  };
}
