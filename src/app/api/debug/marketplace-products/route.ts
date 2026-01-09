import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { marketplaceTenant } from "@/lib/marketplaceTenant";

export const runtime = "nodejs";

export async function GET() {
  const mp = marketplaceTenant();

  const latest = await prisma.product.findMany({
    where: { tenantKey: { in: [mp.key, ...(mp.fallbackKeys ?? [])] } },
    select: { id: true, title: true, status: true, tenantKey: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const counts = await prisma.product.groupBy({
    by: ["tenantKey", "status"],
    _count: { _all: true },
    orderBy: [{ tenantKey: "asc" }, { status: "asc" }],
  });

  return NextResponse.json({
    marketplaceKey: mp.key,
    fallbackKeys: mp.fallbackKeys,
    latestInMarketplace: latest,
    countsByTenantKeyAndStatus: counts,
  });
}
