// src/app/api/vendor/conversion/chart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorApi } from "@/lib/guards/authz";

type RangeParam = "7" | "30" | "90" | "all";

type DayAgg = {
  views: number;
  sales: number;
};

export async function GET(_req: NextRequest) {
  const maybe = await requireVendorApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;
  const vendorId = session?.user?.id;

  if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(_req.url);
  const range = (searchParams.get("range") ?? "30") as RangeParam;

  const days =
    range === "7" ? 7 : range === "90" ? 90 : range === "all" ? 3650 : 30;

  // inclusive range: "days" Tage zurück
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [views, sales] = await Promise.all([
    prisma.productView.findMany({
      where: {
        product: { vendorId },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true }, // include product nicht nötig fürs chart
    }),
    prisma.order.findMany({
      where: {
        product: { vendorId },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  const map = new Map<string, DayAgg>();

  for (const v of views) {
    const day = v.createdAt.toISOString().slice(0, 10);
    const entry = map.get(day) ?? { views: 0, sales: 0 };
    entry.views += 1;
    map.set(day, entry);
  }

  for (const s of sales) {
    const day = s.createdAt.toISOString().slice(0, 10);
    const entry = map.get(day) ?? { views: 0, sales: 0 };
    entry.sales += 1;
    map.set(day, entry);
  }

  // Optional: sort by date (wichtig, weil Map-Reihenfolge davon abhängt, in welcher Reihenfolge keys auftauchen)
  const conversionByDay = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      views: data.views,
      sales: data.sales,
      ctr: data.views > 0 ? data.sales / data.views : 0,
    }));

  return NextResponse.json({ conversionByDay });
}
