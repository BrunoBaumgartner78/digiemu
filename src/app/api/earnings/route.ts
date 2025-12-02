import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // All orders for this vendor
  const orders = await prisma.order.findMany({
    where: { product: { vendorId: userId } },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.amountCents, 0);
  const orderCount = orders.length;
  const averagePrice = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Daily revenue chart (last 30 days)
  const chart = [];
  const days = 30;
  for (let i = 0; i < days; i++) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayString = day.toISOString().split("T")[0];

    const dayRevenue = orders
      .filter((o) => o.createdAt.toISOString().startsWith(dayString))
      .reduce((s, o) => s + o.amountCents, 0);

    chart.unshift({ date: dayString, revenue: dayRevenue });
  }

  // Top products
  const productMap = {};
  for (const o of orders) {
    if (!productMap[o.productId]) {
      productMap[o.productId] = {
        id: o.product.id,
        title: o.product.title,
        revenue: 0,
        sales: 0,
      };
    }
    productMap[o.productId].revenue += o.amountCents;
    productMap[o.productId].sales += 1;
  }

  const topProducts = Object.values(productMap).sort(
    (a, b) => b.revenue - a.revenue
  );

  return NextResponse.json({
    totalRevenue,
    orderCount,
    averagePrice,
    chart,
    topProducts,
  });
}
