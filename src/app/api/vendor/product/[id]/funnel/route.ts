// src/app/api/vendor/funnel/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);

  // Nur Vendors dürfen diese Route nutzen
  if (!session?.user?.id || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // 2) Views zählen – defensiv über any, damit es nicht crasht
    const prismaAny = prisma as any;
    let viewsCount = 0;

    if (
      prismaAny.productView &&
      typeof prismaAny.productView.count === "function"
    ) {
      viewsCount = await prismaAny.productView.count({
        where: {
          productId: { in: productIds },
          createdAt: { gte: since },
        },
      });
    } else {
      // Fallback: kein ProductView-Model im Client → 0 Views
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
  } catch (_err) {
    console.error("Error in /api/vendor/funnel", _err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
