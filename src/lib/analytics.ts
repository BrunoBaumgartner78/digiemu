import { prisma } from "@/lib/prisma";

export async function getTopSellingProductsLast30Days(limit = 3) {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // falls dein Modell anders heißt: DownloadLog / OrderItem etc. anpassen
  return prisma.product.findMany({
    where: {
      downloads: {
        some: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          downloads: true,
        },
      },
    },
    orderBy: {
      downloads: {
        _count: "desc",
      },
    },
    take: limit,
  });
}
