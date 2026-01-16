// src/app/api/vendor/funnel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 👉 Nur eingeloggt checken
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendorId = session.user.id;

    const { searchParams } = new URL(_req.url);
    const rangeParam = searchParams.get("range") ?? "30";
    const rangeDays = Number.isFinite(Number(rangeParam))
      ? parseInt(rangeParam, 10)
      : 30;

    let since: Date | undefined;
    if (rangeDays > 0) {
      since = new Date();
      since.setDate(since.getDate() - rangeDays);
    }

    const viewWhere = {
      product: { vendorId },
      ...(since ? { createdAt: { gte: since } } : {}),
    };

    const orderWhere = {
      product: { vendorId },
      status: "COMPLETED",
      ...(since ? { createdAt: { gte: since } } : {}),
    };

    // Nur Prisma .count() – nirgends `.count` auf undefined lesen
    const [impressions, purchases] = await Promise.all([
      prisma.productView.count({ where: viewWhere }),
      prisma.order.count({ where: orderWhere }),
    ]);

    const views = impressions; // aktuell: Views == Impressions

    const viewRate = impressions > 0 ? views / impressions : 0;
    const purchaseRate = views > 0 ? purchases / views : 0;
    const fullFunnelRate = impressions > 0 ? purchases / impressions : 0;

    return NextResponse.json({
      funnel: {
        impressions,
        views,
        purchases,
        viewRate,
        purchaseRate,
        fullFunnelRate,
      },
    });
  } catch (_err) {
    console.error("Vendor funnel error:", _err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
