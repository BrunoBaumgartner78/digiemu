import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorId = session.user.id;
  const productId = params.id;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30";

  let days = 30;
  if (range === "7") days = 7;
  else if (range === "90") days = 90;
  else if (range === "all") days = 9999;

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Verify vendor owns product
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId }
  });
  if (!product)
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  // Load views
  const views = await prisma.productView.findMany({
    where: {
      productId,
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "asc" }
  });

  // Load sales
  const sales = await prisma.order.findMany({
    where: {
      productId,
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "asc" }
  });

  const map = new Map();

  for (const v of views) {
    const day = v.createdAt.toISOString().slice(0, 10);
    const entry = map.get(day) ?? { views: 0, sales: 0, earningsCents: 0 };
    entry.views += 1;
    map.set(day, entry);
  }

  for (const s of sales) {
    const day = s.createdAt.toISOString().slice(0, 10);
    const entry = map.get(day) ?? { views: 0, sales: 0, earningsCents: 0 };
    entry.sales += 1;
    entry.earningsCents += s.vendorEarningsCents ?? 0;
    map.set(day, entry);
  }

  const aggregated = [...map.entries()].map(([date, data]) => ({
    date,
    views: data.views,
    sales: data.sales,
    earningsCents: data.earningsCents,
    ctr: data.views > 0 ? data.sales / data.views : 0
  }));

  const totalViews = views.length;
  const totalSales = sales.length;
  const totalEarnings = aggregated.reduce(
    (sum, d) => sum + d.earningsCents,
    0
  );

  const ctr = totalViews > 0 ? totalSales / totalViews : 0;

  return NextResponse.json({
    product,
    kpis: {
      views: totalViews,
      sales: totalSales,
      revenueCents: totalEarnings,
      ctr
    },
    chartData: aggregated
  });
}
