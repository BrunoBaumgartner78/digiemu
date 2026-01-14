// src/lib/products.ts
import { prisma } from "@/lib/prisma";
import { marketplaceWhereClause } from "@/lib/marketplace-visibility";

// Wie viele Produkte pro Seite im Marketplace
export const PAGE_SIZE = 9;

export type MarketplaceProduct = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priceCents: number | null;
  status?: string | null;
  isActive?: boolean | null;
  thumbnail: string | null;
  vendorId: string;
  vendorProfileId?: string | null;

  vendorProfile?: {
    id: string;
    isPublic: boolean;
    displayName: string | null;
    avatarUrl: string | null;
    status?: string | null; // ✅ keep status available for marketplace visibility
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
  } = (params ?? {}) as any;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 48 ? pageSize : PAGE_SIZE;

  const trimmedSearch = (search ?? "").toString().trim();
  const hasSearch = trimmedSearch.length > 0;

  // base visibility clause from centralized helper
  const where: any = { AND: [marketplaceWhereClause()] };

  // Optional: Kategorie
  if (category && category !== "all") {
    where.AND.push({ category });
  }

  // Optional: Preisrange
  if (typeof minPriceCents === "number" || typeof maxPriceCents === "number") {
    const price: any = {};
    if (typeof minPriceCents === "number") price.gte = Math.round(minPriceCents);
    if (typeof maxPriceCents === "number") price.lte = Math.round(maxPriceCents);
    where.AND.push({ priceCents: price });
  }

  // Optional: Suche
  if (hasSearch) {
    where.AND.push({
      OR: [
        { title: { contains: trimmedSearch, mode: "insensitive" } },
        { description: { contains: trimmedSearch, mode: "insensitive" } },
      ],
    });
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { priceCents: "asc" };
  else if (sort === "price_desc") orderBy = { priceCents: "desc" };

  // removed dev-only where-clause logging

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      include: {
        vendorProfile: {
          select: {
            id: true,
            displayName: true,
            status: true,
            isPublic: true,
            avatarUrl: true,
            user: { select: { name: true } },
          },
        },
        vendor: { select: { id: true, isBlocked: true, name: true } },
      },
    }),
  ]);

  const normalized: MarketplaceProduct[] = items.map((p: any) => {
    const vp = p.vendorProfile ?? null;
    return {
      id: p.id,
      status: p.status ?? null,
      isActive: typeof p.isActive === "boolean" ? p.isActive : null,
      title: p.title,
      description: p.description ?? null,
      category: p.category ?? null,
      priceCents: typeof p.priceCents === "number" ? p.priceCents : null,
      thumbnail: p.thumbnail ?? null,
      vendorId: p.vendorId,
      vendorProfileId: vp?.id ?? null,
      vendorProfile: vp
        ? {
            id: vp.id,
            isPublic: !!vp.isPublic,
            displayName: vp.displayName ?? null,
            avatarUrl: vp.avatarUrl ?? null,
            status: vp.status ?? null, // ✅ FIX: preserve status for visibility checks/debug
            user: vp.user ?? null,
          }
        : null,
    };
  });

  const pageCount = total === 0 ? 1 : Math.ceil(total / safePageSize);

  return {
    items: normalized,
    total,
    page: safePage,
    pageCount,
  };
}

// Re-export centralized marketplace visibility helpers
export type { VisibilityDebug } from "@/lib/marketplace-visibility";
export {
  getMarketplaceVisibilityDebug,
  marketplaceWhereClause,
} from "@/lib/marketplace-visibility";
