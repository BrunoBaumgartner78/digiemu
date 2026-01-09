// src/lib/products.ts
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export const PAGE_SIZE = 12 as const;

export type ContentOSSort = "newest" | "price_asc" | "price_desc";

export type GetContentOSProductsArgs = {
  tenantKeys: string[];
  page: number;
  pageSize?: number;
  category?: string;
  search?: string;
  sort?: ContentOSSort;
  minPriceCents?: number;
  maxPriceCents?: number;
  acceptProductStatuses?: ProductStatus[];
};

export async function getContentOSProducts(args: GetContentOSProductsArgs) {
  const {
    tenantKeys,
    page,
    pageSize = PAGE_SIZE,
    category,
    search,
    sort = "newest",
    minPriceCents,
    maxPriceCents,
    acceptProductStatuses = [ProductStatus.ACTIVE],
  } = args;

  const where: any = {
    tenantKey: { in: tenantKeys },
    status: { in: acceptProductStatuses },
    isActive: true,
  };

  if (category) where.category = category;

  if (typeof minPriceCents === "number") where.priceCents = { ...(where.priceCents ?? {}), gte: minPriceCents };
  if (typeof maxPriceCents === "number") where.priceCents = { ...(where.priceCents ?? {}), lte: maxPriceCents };

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
  sort === "price_asc"
    ? ({ priceCents: "asc" } as const)
    : sort === "price_desc"
    ? ({ priceCents: "desc" } as const)
    : ({ createdAt: "desc" } as const);


  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        vendorProfile: { include: { user: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return { items, total, pageCount };
}
