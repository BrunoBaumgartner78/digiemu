// src/app/api/vendor/products/stats/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "VENDOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vendorId = user.id;

    const url = new URL(req.url);
    const rangeDaysParam = url.searchParams.get("range_days");
    const rangeDays = Number.isFinite(Number(rangeDaysParam))
      ? Number(rangeDaysParam)
      : 30;

    const now = new Date();
    const since = new Date(
      now.getTime() - rangeDays * 24 * 60 * 60 * 1000
    );

    // --- echte Daten holen ------------------------------------------
    const [
      viewsCount,
      purchasesCount,
      productCount,
      revenueAgg,
    ] = await Promise.all([
      prisma.productView.count({
        where: {
          product: { vendorId },
          createdAt: { gte: since },
        },
      }),
      prisma.order.count({
        where: {
          product: { vendorId },
          createdAt: { gte: since },
          status: "PAID", // ggf. an deinen Erfolgs-Status anpassen
        },
      }),
      prisma.product.count({
        where: { vendorId },
      }),
      prisma.order.aggregate({
        _sum: { amountCents: true },
        where: {
          product: { vendorId },
          createdAt: { gte: since },
          status: "PAID",
        },
      }),
    ]);

    const revenueCents = revenueAgg._sum.amountCents ?? 0;

    // Impressions = Views (für MVP)
    const impressions = viewsCount;

    // simple Rates (0–1)
    const totalPossibleImpressions =
      productCount > 0 ? productCount * rangeDays : 0;

    const viewRate =
      totalPossibleImpressions > 0
        ? impressions / totalPossibleImpressions
        : 0;

    const purchaseRateFromViews =
      viewsCount > 0 ? purchasesCount / viewsCount : 0;

    const fullFunnelRate =
      totalPossibleImpressions > 0
        ? purchasesCount / totalPossibleImpressions
        : 0;

    // --- Antwort: kompatibel zu VendorDashboardPage -----------------
    return NextResponse.json({
      rangeDays,
      impressions,
      views: viewsCount,
      purchases: purchasesCount,
      rates: {
        viewRate,
        purchaseRateFromViews,
        fullFunnelRate,
      },
      totals: {
        impressions,
        views: viewsCount,
        purchases: purchasesCount,
        revenueCents, // <-- wichtig für stats.totals.revenueCents
      },
    });
  } catch (err) {
    console.error("/api/vendor/products/stats error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
