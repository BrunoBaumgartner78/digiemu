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

    // ✅ Lade alle PAID/COMPLETED Orders für Vendor-Produkte
    // (Passe Status ggf. an dein System an: "PAID" / "COMPLETED")
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PAID", "COMPLETED"] },
        product: { vendorId },
      },
      select: {
        createdAt: true,
        vendorEarningsCents: true,
        amountCents: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // ✅ Summe: nimm vendorEarningsCents falls gesetzt, sonst fallback auf amountCents
    const totalEarningsCents = orders.reduce((sum, o) => {
      const v = typeof o.vendorEarningsCents === "number" ? o.vendorEarningsCents : 0;
      const fallback = typeof o.amountCents === "number" ? o.amountCents : 0;
      return sum + (v > 0 ? v : fallback);
    }, 0);

    // ✅ Group by YYYY-MM-DD (UTC stabil)
    const map = new Map<string, number>();
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
      earnings: Number((cents / 100).toFixed(2)), // Chart-friendly CHF
    }));

    return NextResponse.json({
      daily,
      totalEarnings: Number((totalEarningsCents / 100).toFixed(2)),
    });
  } catch (_err) {
    console.error("vendor earnings chart error:", _err);
    return NextResponse.json(
      { error: "Server error", daily: [], totalEarnings: 0 },
      { status: 500 }
    );
  }
}
