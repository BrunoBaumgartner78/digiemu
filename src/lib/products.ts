// src/lib/products.ts
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 12 as const;

export type MarketplaceSort = "newest" | "price_asc" | "price_desc";

type GetMarketplaceProductsArgs = {
  tenantKey: string; // ✅ required: tenant scoping
  page: number;
  pageSize: number;
  category?: string; // "all" | ...
  search?: string;
  sort?: MarketplaceSort;
  minPriceCents?: number;
  maxPriceCents?: number;
};

export async function getMarketplaceProducts(args: GetMarketplaceProductsArgs) {
  const tenantKey = (args.tenantKey || "DEFAULT").trim() || "DEFAULT";
  const pageSize = Math.max(1, Math.min(48, Number(args.pageSize || PAGE_SIZE)));
  const page = Math.max(1, Number(args.page || 1));
  const skip = (page - 1) * pageSize;

  const category = (args.category ?? "all").trim();
  const search = (args.search ?? "").trim();
  const sort: MarketplaceSort = (args.sort ?? "newest") as MarketplaceSort;

  const minPriceCents = typeof args.minPriceCents === "number" ? args.minPriceCents : undefined;
  const maxPriceCents = typeof args.maxPriceCents === "number" ? args.maxPriceCents : undefined;

  // ✅ Option B enforced here:
  // - Product must be ACTIVE + isActive
  // - Vendor not blocked
  // - VendorProfile must exist + isPublic + APPROVED
  const where: any = {
    tenantKey,
    isActive: true,
    status: "ACTIVE",
    vendor: { isBlocked: false },

    vendorProfile: {
      is: {
        isPublic: true,
        status: "APPROVED",
        tenantKey,
      },
    },
  };

  if (category && category !== "all") {
    where.category = category;
  }

  if (search.length > 0) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (minPriceCents !== undefined || maxPriceCents !== undefined) {
    where.priceCents = {};
    if (minPriceCents !== undefined) where.priceCents.gte = minPriceCents;
    if (maxPriceCents !== undefined) where.priceCents.lte = maxPriceCents;
  }

  const orderBy =
    sort === "price_asc"
      ? ({ priceCents: "asc" } as const)
      : sort === "price_desc"
      ? ({ priceCents: "desc" } as const)
      : ({ createdAt: "desc" } as const);

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        tenantKey: true,
        title: true,
        description: true,
        priceCents: true,
        thumbnail: true,
        category: true,
        isActive: true,
        status: true,
        vendorId: true,
        vendorProfileId: true,
        createdAt: true,

        vendorProfile: {
          select: {
            id: true,
            isPublic: true,
            status: true,
            tenantKey: true,
            displayName: true,
            avatarUrl: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return { items, total, pageCount };
}
