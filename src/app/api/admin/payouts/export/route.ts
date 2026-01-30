import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { PayoutStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/guards/authz";

function isPayoutStatus(v: unknown): v is PayoutStatus {
  return v === "PENDING" || v === "PAID" || v === "CANCELLED";
}
import { parsePayoutSearchParams } from "@/lib/payout-filters";

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;

  const url = new URL(_req.url);
  const sp: Record<string, string | string[] | undefined> = {};
  url.searchParams.forEach((value, key) => {
    sp[key] = value;
  });

  const filters = parsePayoutSearchParams(sp);

  const where: Prisma.PayoutWhereInput = {};
  if (filters.status && isPayoutStatus(filters.status)) where.status = filters.status as PayoutStatus;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {} as Prisma.DateTimeFilter;
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  const rows = await prisma.payout.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { id: true, email: true } } },
  });

  const header = ["createdAt", "payoutId", "vendorId", "vendorEmail", "amountCHF", "status"];

  const lines = [
    header.join(","),
    ...rows.map((p) =>
      [
        p.createdAt?.toISOString() ?? "",
        p.id,
        p.vendorId,
        p.vendor?.email ?? "",
        ((p.amountCents ?? 0) / 100).toFixed(2),
        p.status ?? "",
      ].map(csvEscape).join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payouts_${Date.now()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
