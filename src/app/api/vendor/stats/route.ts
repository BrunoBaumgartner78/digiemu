// src/app/api/vendor/products/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireVendorApi } from "../../../../lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { serverLog } from "@/lib/serverLog";
import { getErrorMessage } from "@/lib/guards";

export async function GET(_req: NextRequest) {
  try {
    const maybe = await requireVendorApi();
    if (maybe instanceof NextResponse) return maybe;
    const session = maybe;
    const vendorId = session.user.id;

    const url = new URL(_req.url);
    const rangeDays = Number(url.searchParams.get("range_days") ?? "30");
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

    serverLog.log("[DEV] /api/vendor/products/stats HIT", new Date().toISOString());
    serverLog.log("[DEV] range_days =", rangeDays);

    // Produkte des Vendors
    const products = await prisma.product.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json({
        productsCount: 0,
        viewsTotal: 0,
        viewsInRange: 0,
        ordersTotal: 0,
        ordersInRange: 0,
        downloadsTotal: 0,
        downloadsInRange: 0,
      });
    }

    // Views
    const [viewsTotal, viewsInRange] = await Promise.all([
      prisma.productView.count({
        where: { productId: { in: productIds } },
      }),
      prisma.productView.count({
        where: {
          productId: { in: productIds },
          createdAt: { gte: since },
        },
      }),
    ]);

    // Orders
    const [ordersTotal, ordersInRange] = await Promise.all([
      prisma.order.count({
        where: { productId: { in: productIds } },
      }),
      prisma.order.count({
        where: {
          productId: { in: productIds },
          createdAt: { gte: since },
        },
      }),
    ]);

    // Downloads
    const [downloadsTotal, downloadsInRange] = await Promise.all([
      prisma.downloadLink.count({
        where: { order: { productId: { in: productIds } } },
      }),
      prisma.downloadLink.count({
        where: {
          order: { productId: { in: productIds } },
          createdAt: { gte: since },
        },
      }),
    ]);

    return NextResponse.json({
      productsCount: productIds.length,
      viewsTotal,
      viewsInRange,
      ordersTotal,
      ordersInRange,
      downloadsTotal,
      downloadsInRange,
    });
  } catch (_err: unknown) {
    console.error("/api/vendor/products/stats error", getErrorMessage(_err));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
