// src/app/api/vendor/products/stats/route.ts

import { NextResponse } from "next/server";
import { requireRoleApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/guards";

export async function GET(_req: Request) {
  try {
    // compute rangeDays early so we can return compatible empty payloads when unauthenticated
    const url = new URL(_req.url);
    const rangeDaysParam = url.searchParams.get("range_days");
    const rangeDays = Number.isFinite(Number(rangeDaysParam))
      ? Number(rangeDaysParam)
      : 30;

    const maybe = await requireRoleApi(["VENDOR", "ADMIN"]);
    // preserve behavior: NEVER return 401 from this endpoint (treat unauthenticated as empty stats)
    if (maybe instanceof NextResponse) {
      if (maybe.status === 401) {
        // return empty but compatible response (200)
        return NextResponse.json({
          rangeDays,
          impressions: 0,
          views: 0,
          purchases: 0,
          rates: { viewRate: 0, purchaseRateFromViews: 0, fullFunnelRate: 0 },
          totals: { impressions: 0, views: 0, purchases: 0, revenueCents: 0 },
        });
      }
      if (maybe.status === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return maybe;
    }

    const session = maybe;
    const user = session.user;
    const vendorId = user.id;

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
    } catch (_err: unknown) {
      console.error("/api/vendor/products/stats error", getErrorMessage(_err));
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
