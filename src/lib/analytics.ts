import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Top selling products in the last 30 days.
 * NOTE: This assumes Product has a relation called `orders`.
 * If your schema uses OrderItem/LineItem, we’ll adjust.
 */
export async function getTopSellingProductsLast30Days(limit = 3) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  try {
    return await prisma.product.findMany({
      where: {
        orders: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: {
        orders: { _count: "desc" },
      },
      take: limit,
    });
  } catch (_e) {
    // never hard-crash the whole app because analytics fails
    return [];
  }
}
