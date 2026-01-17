// src/app/api/vendor/stats/charts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorApi } from "@/lib/guards/authz";

type SessionUser = {
  id: string;
  role?: string;
  email?: string | null;
  name?: string | null;
};

type SessionLike = {
  user?: SessionUser;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const maybe = await requireVendorApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe as SessionLike;

  const vendorId = session?.user?.id;
  if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(_req.url);
  const range = searchParams.get("range") ?? "30";

  let days = 30;
  if (range === "7") days = 7;
  else if (range === "90") days = 90;
  else if (range === "all") days = 3650;

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Beispiel: Views + Sales pro Tag (passe Model-Namen an deine echten an)
  const views = await prisma.productView.findMany({
    where: { product: { vendorId }, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const sales = await prisma.order.findMany({
    where: { product: { vendorId }, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, { views: number; sales: number }>();

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

  const conversionByDay = [...map.entries()].map(([date, data]) => ({
    date,
    views: data.views,
    sales: data.sales,
    ctr: data.views > 0 ? data.sales / data.views : 0,
  }));

  return NextResponse.json({ conversionByDay });
}
