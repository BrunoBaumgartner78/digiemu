// src/app/api/vendor/earnings/chart/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Aggregation helper
function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "VENDOR") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const vendorId = session.user.id;

  // Vendor-Produkte mit Orders laden
  const products = await prisma.product.findMany({
    where: { vendorId },
    include: {
      orders: {
        select: { vendorEarningsCents: true, createdAt: true },
      },
    },
  });

  // Umsatzverlauf pro Tag
  const dailyMap: Record<string, number> = {};

  // Top-Produkte map
  const productMap: Record<string, number> = {};

  let total = 0;

  for (const p of products) {
    let productTotal = 0;

    for (const o of p.orders) {
      const amount = o.vendorEarningsCents || 0;
      total += amount;
      productTotal += amount;

      const day = formatDate(o.createdAt);
      dailyMap[day] = (dailyMap[day] || 0) + amount;
    }

    if (productTotal > 0) {
      productMap[p.title] = productTotal;
    }
  }

  // Format für Charts
  const daily = Object.entries(dailyMap).map(([day, value]) => ({
    date: day,
    earnings: value / 100,
  }));

  const topProducts = Object.entries(productMap)
    .map(([title, value]) => ({
      title,
      earnings: value / 100,
    }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10);

  return NextResponse.json({
    totalEarnings: total / 100,
    daily,
    topProducts,
  });
}
