// src/app/api/analytics/revenue-30d/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const paidLikeStatuses = [
  "PAID",
  "paid",
  "COMPLETED",
  "completed",
  "SUCCESS",
  "success",
] as const;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    const role = (session?.user as any)?.role as string | undefined;

    if (!userId || !role) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    if (role !== "VENDOR" && role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const rangeDays = 30;
    const rangeStart = new Date(Date.now() - rangeDays * 86400000);

    // Vendor: eigene Produkte; Admin: ebenfalls erstmal userId als vendorId (du kannst später admin-view erweitern)
    const vendorId = userId;

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: rangeStart },
        status: { in: paidLikeStatuses as any },
        product: { vendorId },
      },
      select: { createdAt: true, amountCents: true },
    });

    const map: Record<string, number> = {};
    for (const o of orders) {
      const k = isoDay(o.createdAt);
      map[k] = (map[k] ?? 0) + (o.amountCents ?? 0);
    }

    const data: { date: string; value: number }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = isoDay(d);
      const cents = map[key] ?? 0;
      data.push({ date: key, value: Math.round((cents / 100) * 100) / 100 }); // CHF
    }

    const max = Math.max(0, ...data.map((x) => x.value));

    return NextResponse.json(
      {
        ok: true,
        data,
        max,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("revenue-30d error", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
