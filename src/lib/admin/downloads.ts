import { prisma } from "@/lib/prisma";

export type DownloadRow = {
  id: string;
  createdAt: Date;

  orderId: string;
  productId: string;
  productTitle: string;

  buyerId: string;
  buyerEmail: string | null;

  vendorId: string;
  vendorEmail: string | null;

  expiresAt: Date | null;
  isActive: boolean;
  downloadCount: number;
  maxDownloads: number | null;
};

export type DownloadFilters = {
  from?: string;
  to?: string;
  productId?: string;
  vendorId?: string;
  buyerId?: string;
};

export type AdminDownloadsResult = {
  rows: DownloadRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pie: { productId: string; productTitle: string; count: number }[];
};

function parseDateMaybe(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function getAdminDownloads(
  params: DownloadFilters & { page?: number; pageSize?: number; productQ?: string; vendorQ?: string; buyerQ?: string }
): Promise<AdminDownloadsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 25));

  const from = parseDateMaybe(params.from);
  const toRaw = parseDateMaybe(params.to);
  const to = toRaw ? endOfDay(toRaw) : undefined;

  const norm = (s?: string) => (s && s.trim() ? s.trim() : undefined);
  const pid = norm((params as any).productId ?? params.productId);
  const vid = norm((params as any).vendorId ?? params.vendorId);
  const bid = norm((params as any).buyerId ?? params.buyerId);
  const pq = norm((params as any).productQ ?? (params as any).productQ);
  const vq = norm((params as any).vendorQ ?? (params as any).vendorQ);
  const bq = norm((params as any).buyerQ ?? (params as any).buyerQ);

  const where: any = {};

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  // build order-related filters (buyer/product/vendor)
  if (pid || pq || vid || vq || bid || bq) {
    const orderWhere: any = {};

    if (bid) orderWhere.buyerId = bid;
    if (pid) orderWhere.productId = pid;

    // product-level filters
    const productWhere: any = {};
    if (pid) {
      // productId already handled via order.productId
    }
    if (pq && !pid) productWhere.title = { contains: pq, mode: "insensitive" };
    if (vid) productWhere.vendorId = vid;
    if (vq && !vid) {
      productWhere.vendor = {
        OR: [
          { email: { contains: vq, mode: "insensitive" } },
          { name: { contains: vq, mode: "insensitive" } },
        ],
      };
    }

    if (Object.keys(productWhere).length > 0) orderWhere.product = productWhere;

    // buyer text fallback
    if (bq && !bid) {
      orderWhere.buyer = {
        OR: [
          { email: { contains: bq, mode: "insensitive" } },
          { name: { contains: bq, mode: "insensitive" } },
        ],
      };
    }

    where.order = orderWhere;
  }

  const [items, total] = await Promise.all([
    prisma.downloadLink.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        isActive: true,
        downloadCount: true,
        maxDownloads: true,
        order: {
          select: {
            id: true,
            buyerId: true,
            buyer: { select: { email: true } },
            productId: true,
            product: {
              select: {
                title: true,
                vendorId: true,
                vendor: { select: { email: true } },
              },
            },
          },
        },
      },
    }),
    prisma.downloadLink.count({ where }),
  ]);

  const rows: DownloadRow[] = items.map((d) => ({
    id: d.id,
    createdAt: d.createdAt,
    orderId: d.order.id,
    productId: d.order.productId,
    productTitle: d.order.product.title,
    buyerId: d.order.buyerId,
    buyerEmail: d.order.buyer?.email ?? null,
    vendorId: d.order.product.vendorId,
    vendorEmail: d.order.product.vendor?.email ?? null,
    expiresAt: d.expiresAt,
    isActive: d.isActive,
    downloadCount: d.downloadCount,
    maxDownloads: d.maxDownloads,
  }));

  const counts = new Map<string, { productId: string; productTitle: string; count: number }>();
  for (const r of rows) {
    const cur =
      counts.get(r.productId) ?? { productId: r.productId, productTitle: r.productTitle, count: 0 };
    cur.count += 1;
    counts.set(r.productId, cur);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages,
    pie: Array.from(counts.values()).sort((a, b) => b.count - a.count),
  };
}
