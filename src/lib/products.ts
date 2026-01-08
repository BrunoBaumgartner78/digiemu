// src/lib/products.ts
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 12 as const;

export type MarketplaceSort = "newest" | "price_asc" | "price_desc";

type GetMarketplaceProductsArgs = {
  tenantKey: string;
  page: number;
  pageSize: number;
  category?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  minPriceCents?: number;
  maxPriceCents?: number;

  // ✅ NEW: getrennte Enums
  acceptProductStatuses?: string[]; // ProductStatus values
  acceptVendorStatuses?: string[]; // VendorStatus values
};

export async function getMarketplaceProducts(args: GetMarketplaceProductsArgs) {
  const {
    tenantKey,
    page,
    pageSize,
    category,
    search,
    sort = "newest",
    minPriceCents,
    maxPriceCents,
    acceptProductStatuses,
    acceptVendorStatuses,
  } = args;

  const skip = (page - 1) * pageSize;

  // ✅ sichere Defaults
  const productStatuses = acceptProductStatuses?.length
    ? acceptProductStatuses
    : (["PUBLISHED"] as const);

  const where: any = {
    tenantKey,
    isActive: true,
    ...(category ? { category } : {}),
    ...(typeof minPriceCents === "number" ? { priceCents: { gte: minPriceCents } } : {}),
    ...(typeof maxPriceCents === "number" ? { priceCents: { ...(typeof minPriceCents === "number" ? { gte: minPriceCents } : {}), lte: maxPriceCents } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),

    // ProductStatus (string values)
    status: { in: productStatuses },

    // Vendor/VendorProfile Guards - vendorProfile.status is an enum (VendorStatus).
    // Only allow APPROVED vendor profiles to be shown in marketplace.
    vendor: { isBlocked: false },
    vendorProfile: {
      is: {
        tenantKey,
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
