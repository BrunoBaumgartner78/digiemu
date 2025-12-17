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

/**
 * Liefert Produkte für den Marketplace:
 * - paginiert
 * - optional nach Kategorie gefiltert
 * - optional mit Textsuche
 * - nur aktive & nicht blockierte Produkte
 */
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

  const safePage =
    Number.isFinite(page) && page > 0 ? page : 1;

  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 48
      ? pageSize
      : PAGE_SIZE;

  // 🔹 Basis-Filter: Nur sichtbare Produkte im Marketplace
  const where: any = {
    isActive: true,             // Vendor hat Produkt aktiviert
    status: "ACTIVE",         // nur vollständig veröffentlichte Produkte
  };

  // 🔹 Kategorie-Filter
  if (category && category !== "all") {
    where.category = category;
  }

  // 🔹 Textsuche (Titel + Beschreibung)
  const trimmedSearch = search.trim();
  if (trimmedSearch.length > 0) {
    where.OR = [
      {
        title: {
          contains: trimmedSearch,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: trimmedSearch,
          mode: "insensitive",
        },
      },
    ];
  }

  // 🔹 Preis-Range (in cents)
  if (typeof minPriceCents === "number" || typeof maxPriceCents === "number") {
    where.priceCents = {} as any;
    if (typeof minPriceCents === "number") where.priceCents.gte = Math.round(minPriceCents);
    if (typeof maxPriceCents === "number") where.priceCents.lte = Math.round(maxPriceCents);
  }

  // 🔹 Sortierung
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { priceCents: "asc" };
  else if (sort === "price_desc") orderBy = { priceCents: "desc" };

  const [total, products] = await Promise.all([
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
    }),
  ]);

  const pageCount = total === 0 ? 1 : Math.ceil(total / safePageSize);

  return {
    items: products,
    total,
    page: safePage,
    pageCount,
  };
}
