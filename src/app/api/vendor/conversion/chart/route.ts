import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const vendorId = session.user.id;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30";

  let days = 30;
  if (range === "7") days = 7;
  else if (range === "90") days = 90;
  else if (range === "all") days = 9999;

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Load views
  const views = await prisma.productView.findMany({
    where: {
      product: { vendorId },
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "asc" },
    include: { product: true }
  });

  // Load sales
  const sales = await prisma.order.findMany({
    where: {
      product: { vendorId },
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "asc" }
  });

  const map = new Map();

  // Aggregate views
  for (const v of views) {
    const day = v.createdAt.toISOString().slice(0, 10);
    const entry = map.get(day) ?? { views: 0, sales: 0 };
    entry.views += 1;
    map.set(day, entry);
  }

  // Aggregate sales
  for (const s of sales) {
    const day = s.createdAt.toISOString().slice(0, 10);
    const entry = map.get(day) ?? { views: 0, sales: 0 };
    entry.sales += 1;
    map.set(day, entry);
  }

  const conversionByDay = [...map.entries()].map(([date, data]) => ({
    date,
    views: data.views,
    sales: data.sales,
    ctr: data.views > 0 ? data.sales / data.views : 0
  }));

  return NextResponse.json({ conversionByDay });
}
