// src/app/api/vendor/funnel/route.ts

import { NextResponse } from "next/server";
import { requireVendorApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

// Hilfsfunktion: Range in Tagen aus Query lesen (?range oder ?range_days)
function parseRangeDays(url: string): number {
  const u = new URL(url);
  const raw =
    u.searchParams.get("range") ?? u.searchParams.get("range_days");
  const n = raw ? parseInt(raw, 10) : 30;

  if (!Number.isFinite(n) || n <= 0) return 30;
  if (n > 365) return 365;
  return n;
}

export async function GET(_req: Request) {
  const maybe = await requireVendorApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;

  const rangeDays = parseRangeDays(_req.url);
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

  try {
    // 1) Alle Produkte dieses Vendors
    const products = await prisma.product.findMany({
      where: {
        vendorId: session.user.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (products.length === 0) {
      return NextResponse.json({
        rangeDays,
        funnel: {
          impressions: 0,
          views: 0,
          purchases: 0,
          viewRate: 0,
          purchaseRate: 0,
          fullFunnelRate: 0,
        },
      });
    }

    const productIds = products.map((p) => p.id);

    // 2) Views zählen. If productView doesn't exist or the query fails, fall back to 0.
    let viewsCount = 0;
    try {
      viewsCount = await prisma.productView.count({
        where: { productId: { in: productIds }, createdAt: { gte: since } },
      });
    } catch (e) {
      // If the model isn't available in this Prisma client, keep viewsCount = 0
      viewsCount = 0;
    }

    // 3) Käufe zählen
    const purchasesCount = await prisma.order.count({
      where: {
        productId: { in: productIds },
        status: "COMPLETED",
        createdAt: { gte: since },
      },
    });

    // 4) Impressions = aktuell Views (später evtl. eigene Impressions-Logik)
    const impressionsCount = viewsCount;

    const viewRate =
      impressionsCount > 0 ? viewsCount / impressionsCount : 0;
    const purchaseRate = viewsCount > 0 ? purchasesCount / viewsCount : 0;
    const fullFunnelRate =
      impressionsCount > 0 ? purchasesCount / impressionsCount : 0;

    return NextResponse.json({
      rangeDays,
      funnel: {
        impressions: impressionsCount,
        views: viewsCount,
        purchases: purchasesCount,
        viewRate,
        purchaseRate,
        fullFunnelRate,
      },
    });
  } catch (_err: unknown) {
    console.error("Error in /api/vendor/funnel", _err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
