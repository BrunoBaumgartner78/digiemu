// src/app/api/vendor/products/stats/route.ts
import { NextResponse } from "next/server";

type Totals = {
  revenueCents: number;
  totalSales: number;
  totalViews: number;
  conversionRate: number;
  vendorEarningsCents: number;
};

type ProductStat = {
  id: string;
  title: string;
  views: number;
  sales: number;
  conversionRate: number;
  revenueCents: number;
  vendorEarningsCents: number;
};

type RevenuePoint = { date: string; revenueCents: number };
type ComparePoint = { title: string; views: number; sales: number };

type StatsResponse = {
  totals: Totals;
  products: ProductStat[];
  revenueData: RevenuePoint[];
  compareData: ComparePoint[];
};

function emptyStats(): StatsResponse {
  return {
    totals: {
      revenueCents: 0,
      totalSales: 0,
      totalViews: 0,
      conversionRate: 0,
      vendorEarningsCents: 0,
    },
    products: [],
    revenueData: [],
    compareData: [],
  };
}

// Option B: Debug-Logger (nur wenn explizit via Env-Flag aktiviert)
const isDebug = process.env.DEBUG_VENDOR_STATS === "1";
const dbg = (...args: any[]) => {
  if (isDebug) console.log(...args);
};

export async function GET(request: Request) {
  dbg("[DEV] /api/vendor/products/stats HIT", new Date().toISOString());

  const url = new URL(request.url);
  const rangeDays = url.searchParams.get("range_days") ?? "unknown";
  dbg("[DEV] range_days =", rangeDays);

  // DEV: immer leere Stats zurückgeben, aber **nie** 401
  const payload = emptyStats();
  return NextResponse.json(payload, { status: 200 });
}
