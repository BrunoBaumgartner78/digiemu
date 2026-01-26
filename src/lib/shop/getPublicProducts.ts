import { prisma } from "@/lib/prisma";
import { productWherePublic } from "@/lib/curation/where";
import { productCardSelect } from "@/lib/curation/select";

export async function getPublicProducts() {
  return prisma.product.findMany({
    where: productWherePublic(),
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
    take: 48,
  });
}
