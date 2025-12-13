import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

type ChartPoint = { date: string; revenueCents: number };

type ProductAgg = {
  id: string;
  title: string;
  revenueCents: number;
  sales: number;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ All orders for this vendor (über VendorProfile->userId)
  const orders = await prisma.order.findMany({
    where: {
      product: {
        vendorProfile: {
          userId,
        },
      },
    },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  const totalRevenueCents = orders.reduce((sum, o) => sum + o.amountCents, 0);
  const orderCount = orders.length;
  const averagePriceCents = orderCount > 0 ? Math.round(totalRevenueCents / orderCount) : 0;

  // Daily revenue chart (last 30 days)
  const chart: ChartPoint[] = [];
  const days = 30;

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);

    const dayStart = new Date(day);
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayString = day.toISOString().slice(0, 10);

    const dayRevenueCents = orders
      .filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd)
      .reduce((s, o) => s + o.amountCents, 0);

    chart.push({ date: dayString, revenueCents: dayRevenueCents });
  }

  // Top products
  const productMap: Record<string, ProductAgg> = {};

  for (const o of orders) {
    const pid = o.productId;
    const p = o.product;

    if (!productMap[pid]) {
      productMap[pid] = {
        id: p.id,
        title: p.title,
        revenueCents: 0,
        sales: 0,
      };
    }

    productMap[pid].revenueCents += o.amountCents;
    productMap[pid].sales += 1;
  }

  const topProducts = Object.values(productMap).sort(
    (a, b) => b.revenueCents - a.revenueCents
  );

  return NextResponse.json({
    totalRevenueCents,
    orderCount,
    averagePriceCents,
    chart,
    topProducts,
  });
}
