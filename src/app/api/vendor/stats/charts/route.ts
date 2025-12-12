// src/app/api/vendor/stats/chart/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type StatsResponse = {
  totals: {
    revenueCents: number;
    totalSales: number;
    totalViews: number;
    conversionRate: number;
    vendorEarningsCents: number;
  };
  products: {
    id: string;
    title: string;
    views: number;
    sales: number;
    conversionRate: number;
    revenueCents: number;
    vendorEarningsCents: number;
  }[];
  revenueData: { date: string; revenueCents: number }[];
  compareData: { title: string; views: number; sales: number }[];
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const vendorId = session.user.id;

    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") ?? "30";
    let rangeDays = parseInt(rangeParam, 10);

    if (isNaN(rangeDays) || rangeDays <= 0) {
      rangeDays = 30;
    }

    // 365 behandeln wir als "Alle"
    const useAllTime = rangeDays >= 365;

    let since = new Date();
    if (!useAllTime) {
      since.setDate(since.getDate() - rangeDays);
    }

    const dateFilter = useAllTime ? {} : { createdAt: { gte: since } };

    // Alle Produkte des Vendors inkl. Orders + Views im Zeitraum
    const products = await prisma.product.findMany({
      where: {
        vendorId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        orders: {
          where: dateFilter,
          select: {
            id: true,
            createdAt: true,
            vendorEarningsCents: true,
          },
        },
        views: {
          where: dateFilter,
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    // Aggregation
    let totalViews = 0;
    let totalSales = 0;
    let totalRevenueCents = 0;
    let totalVendorEarningsCents = 0;

    const perDayRevenue = new Map<string, number>();

    const productStats = products.map((p) => {
      const viewsCount = p.views.length;
      const salesCount = p.orders.length;

      // Für MVP setzen wir revenue = vendorEarnings
      const productVendorEarnings = p.orders.reduce(
        (sum, o) => sum + (o.vendorEarningsCents ?? 0),
        0
      );
      const productRevenueCents = productVendorEarnings;

      // Conversion pro Produkt
      const conversionRate =
        viewsCount > 0 ? salesCount / viewsCount : 0;

      // Totals
      totalViews += viewsCount;
      totalSales += salesCount;
      totalRevenueCents += productRevenueCents;
      totalVendorEarningsCents += productVendorEarnings;

      // Revenue-Verlauf pro Tag
      for (const o of p.orders) {
        const day = o.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
        const prev = perDayRevenue.get(day) ?? 0;
        perDayRevenue.set(day, prev + (o.vendorEarningsCents ?? 0));
      }

      return {
        id: p.id,
        title: p.title,
        views: viewsCount,
        sales: salesCount,
        conversionRate,
        revenueCents: productRevenueCents,
        vendorEarningsCents: productVendorEarnings,
      };
    });

    const overallConversionRate =
      totalViews > 0 ? totalSales / totalViews : 0;

    // revenueData: sortiert nach Datum
    const revenueData = Array.from(perDayRevenue.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, revenueCents]) => ({
        date,
        revenueCents,
      }));

    // compareData für Bar-Chart
    const compareData = productStats.map((p) => ({
      title: p.title,
      views: p.views,
      sales: p.sales,
    }));

    const payload: StatsResponse = {
      totals: {
        revenueCents: totalRevenueCents,
        totalSales,
        totalViews,
        conversionRate: overallConversionRate,
        vendorEarningsCents: totalVendorEarningsCents,
      },
      products: productStats,
      revenueData,
      compareData,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error in /api/vendor/stats/chart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
