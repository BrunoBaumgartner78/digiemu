// src/app/api/admin/downloads/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

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

export async function GET(req: Request) {
  const maybe = await requireAdminApi(req as NextRequest);
  if (maybe instanceof NextResponse) return maybe;

  const url = new URL(req.url);

  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const productId = url.searchParams.get("productId") ?? undefined;
  const vendorId = url.searchParams.get("vendorId") ?? undefined;
  const buyerId = url.searchParams.get("buyerId") ?? undefined;

  const pageSize = Math.min(
    5000,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "500"))
  );
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));

  const fromD = parseDateMaybe(from);
  const toRaw = parseDateMaybe(to);
  const toD = toRaw ? endOfDay(toRaw) : undefined;

  const where: Prisma.DownloadLinkWhereInput = {};

  if (fromD || toD) {
    where.createdAt = {};
    if (fromD) (where.createdAt as Prisma.DateTimeFilter).gte = fromD;
    if (toD) (where.createdAt as Prisma.DateTimeFilter).lte = toD;
  }

  if (buyerId || productId || vendorId) {
    where.order = {};
    if (buyerId) where.order.buyerId = buyerId;
    if (productId) where.order.productId = productId;
    if (vendorId) where.order.product = { vendorId };
  }

  const items = await prisma.downloadLink.findMany({
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
  });

  const header = [
    "downloadLinkId",
    "createdAt",
    "expiresAt",
    "isActive",
    "downloadCount",
    "maxDownloads",
    "orderId",
    "productId",
    "productTitle",
    "vendorId",
    "vendorEmail",
    "buyerId",
    "buyerEmail",
  ];

  const lines: string[] = [header.join(",")];

  for (const d of items) {
    const row = [
      d.id,
      d.createdAt.toISOString(),
      d.expiresAt ? d.expiresAt.toISOString() : "",
      d.isActive ? "true" : "false",
      String(d.downloadCount ?? 0),
      d.maxDownloads === null ? "" : String(d.maxDownloads),
      d.order.id,
      d.order.productId,
      d.order.product.title,
      d.order.product.vendorId,
      d.order.product.vendor?.email ?? "",
      d.order.buyerId,
      d.order.buyer?.email ?? "",
    ].map(csvEscape);

    lines.push(row.join(","));
  }

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-downloads.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
