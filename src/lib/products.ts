// src/lib/products.ts
import { prisma } from "@/lib/prisma";

// Wie viele Produkte pro Seite im Marketplace
export const PAGE_SIZE = 9;

export type MarketplaceProduct = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priceCents: number | null;
  thumbnail: string | null;
  vendorId: string;
  vendorProfileId?: string | null;

  // ✅ IMMER befüllt, egal ob Product.vendorProfileId gesetzt ist oder nicht
  vendorProfile?: {
    id: string;
    isPublic: boolean;
    displayName: string | null;
    avatarUrl: string | null;
    user?: { name: string | null } | null;
  } | null;
};

export type MarketplaceQueryResult = {
  items: MarketplaceProduct[];
  total: number;
  page: number;
  pageCount: number;
};

type GetMarketplaceProductsParams = {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  /** min/max price in cents (integer) */
  minPriceCents?: number | undefined;
  maxPriceCents?: number | undefined;
};

export async function getMarketplaceProducts(
  params: GetMarketplaceProductsParams
): Promise<MarketplaceQueryResult> {
  const {
    page = 1,
    pageSize = PAGE_SIZE,
    category = "all",
    search = "",
    sort = "newest",
    minPriceCents,
    maxPriceCents,
  } = params;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 48 ? pageSize : PAGE_SIZE;

  const where: any = {
    isActive: true,
    status: "ACTIVE",
    // Exclude products whose vendor was blocked by admin
    vendor: { isBlocked: false },
  };

  if (category && category !== "all") where.category = category;

  const trimmedSearch = search.trim();
  if (trimmedSearch.length > 0) {
    where.OR = [
      { title: { contains: trimmedSearch, mode: "insensitive" } },
      { description: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  if (typeof minPriceCents === "number" || typeof maxPriceCents === "number") {
    where.priceCents = {} as any;
    if (typeof minPriceCents === "number") where.priceCents.gte = Math.round(minPriceCents);
    if (typeof maxPriceCents === "number") where.priceCents.lte = Math.round(maxPriceCents);
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { priceCents: "asc" };
  else if (sort === "price_desc") orderBy = { priceCents: "desc" };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priceCents: true,
        thumbnail: true,
        vendorId: true,
        vendorProfileId: true,

        // 1) falls Product.vendorProfileId vorhanden ist
        vendorProfile: {
          select: {
            id: true,
            isPublic: true,
            displayName: true,
            avatarUrl: true,
            user: { select: { name: true } },
          },
        },

        // 2) ✅ fallback: immer über vendorId -> User -> vendorProfile holen
        vendor: {
          select: {
            name: true,
            vendorProfile: {
              select: {
                id: true,
                isPublic: true,
                displayName: true,
                avatarUrl: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // ✅ normalize: vendorProfile ist immer aus einer der beiden Quellen
  const items: MarketplaceProduct[] = rows.map((p: any) => {
    const vp =
      p.vendorProfile ??
      p.vendor?.vendorProfile ??
      null;

    return {
      id: p.id,
      title: p.title,
      description: p.description ?? null,
      category: p.category ?? null,
      priceCents: typeof p.priceCents === "number" ? p.priceCents : null,
      thumbnail: p.thumbnail ?? null,
      vendorId: p.vendorId,
      vendorProfileId: p.vendorProfileId ?? vp?.id ?? null,
      vendorProfile: vp,
    };
  });

  const pageCount = total === 0 ? 1 : Math.ceil(total / safePageSize);

  return {
    items,
    total,
    page: safePage,
    pageCount,
  };
}
