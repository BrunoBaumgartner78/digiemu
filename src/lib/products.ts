// src/lib/products.ts
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export const PAGE_SIZE = 12 as const;

export type MarketplaceSort = "newest" | "price_asc" | "price_desc";

export type GetMarketplaceProductsArgs = {
  // NEW: allow multiple tenant keys (useful while migrating data)
  tenantKeys?: string[];
  tenantKey?: string;

  page: number;
  pageSize: number;
  category?: string;
  search?: string;
  sort?: MarketplaceSort;
  minPriceCents?: number;
  maxPriceCents?: number;

  // Product.status is enum ProductStatus in DB.
  // Be defensive: caller may pass strings; we filter to valid enum values.
  acceptProductStatuses?: string[];
};

export async function getMarketplaceProducts(args: GetMarketplaceProductsArgs) {
  const {
    tenantKeys,
    tenantKey,
    page,
    pageSize,
    category,
    search,
    sort = "newest",
    minPriceCents,
    maxPriceCents,
    acceptProductStatuses,
  } = args;

  const keys =
    (tenantKeys?.length ? tenantKeys : undefined) ??
    (tenantKey ? [tenantKey] : ["MARKETPLACE"]);

  const skip = (page - 1) * pageSize;

  // Product.status is a ProductStatus enum. Be defensive: allow only valid enum values.
  const allowed = new Set(Object.values(ProductStatus));

  const productStatuses = (acceptProductStatuses?.length
    ? acceptProductStatuses
    : [ProductStatus.ACTIVE]
  ).filter((s) => allowed.has(s as ProductStatus)) as ProductStatus[];

  const priceWhere: any = {};
  if (typeof minPriceCents === "number") priceWhere.gte = minPriceCents;
  if (typeof maxPriceCents === "number") priceWhere.lte = maxPriceCents;

  const where: any = {
    tenantKey: { in: keys },
    isActive: true,
    ...(category ? { category } : {}),
    ...(Object.keys(priceWhere).length ? { priceCents: priceWhere } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),

    // Product is enum status
    status: { in: productStatuses },

    // marketplace safety
    vendor: { is: { isBlocked: false } },

    // VendorProfile.status is enum VendorStatus
    vendorProfile: {
      is: {
        isPublic: true,
        status: "APPROVED",
      },
    },
  };

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
      include: {
        vendorProfile: { include: { user: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { total, items, pageCount };
}
