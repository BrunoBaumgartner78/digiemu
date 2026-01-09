// src/app/api/vendor/earnings/chart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Next 16 compatible signature
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "VENDOR") {
      return NextResponse.json(
        { error: "Unauthorized", daily: [], totalEarnings: 0 },
        { status: 401 }
      );
    }

    const vendorId = session.user.id;

    // Compute last 30 days (including today) at UTC date boundaries
    const DAYS = 30;
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (DAYS - 1));

    // Load orders in range for vendor
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PAID", "COMPLETED"] },
        createdAt: { gte: start },
        product: { vendorId },
      },
      select: {
        createdAt: true,
        vendorEarningsCents: true,
        amountCents: true,
      },
    });

    const totalEarningsCents = orders.reduce((sum, o) => {
      const v = typeof o.vendorEarningsCents === "number" ? o.vendorEarningsCents : 0;
      const fallback = typeof o.amountCents === "number" ? o.amountCents : 0;
      return sum + (v > 0 ? v : fallback);
    }, 0);

    // Prepare map with all days initialized to 0
    const map = new Map<string, number>();
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate()
      ).padStart(2, "0")}`;
      map.set(key, 0);
    }

    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate()
      ).padStart(2, "0")}`;

      const v = typeof o.vendorEarningsCents === "number" ? o.vendorEarningsCents : 0;
      const fallback = typeof o.amountCents === "number" ? o.amountCents : 0;
      const cents = v > 0 ? v : fallback;

      map.set(key, (map.get(key) ?? 0) + cents);
    }

    const daily = Array.from(map.entries()).map(([date, cents]) => ({
      date,
      earningsCents: cents,
    }));

    return NextResponse.json({ daily, totalEarningsCents });
  } catch (err) {
    console.error("vendor earnings chart error:", err);
    return NextResponse.json(
      { error: "Server error", daily: [], totalEarnings: 0 },
      { status: 500 }
    );
  }
}
