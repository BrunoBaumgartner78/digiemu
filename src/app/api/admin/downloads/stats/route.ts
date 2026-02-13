// src/app/api/admin/downloads/stats/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { getAdminDownloads } from "@/lib/admin/downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // requireAdminApi erwartet bei dir NextRequest – wir geben ihm trotzdem req,
  // aber "Request" reicht TS nicht. Daher casten wir sauber.
  const maybe = await requireAdminApi(req as any);
  if (maybe instanceof NextResponse) return maybe;

  const url = new URL(req.url);

  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const productId = url.searchParams.get("productId") ?? undefined;
  const vendorId = url.searchParams.get("vendorId") ?? undefined;
  const buyerId = url.searchParams.get("buyerId") ?? undefined;

  // Für Stats holen wir "genug" Rows, damit pie sinnvoll ist
  const result = await getAdminDownloads({
    page: 1,
    pageSize: 200,
    from,
    to,
    productId,
    vendorId,
    buyerId,
  });

  return NextResponse.json({
    total: result.total,
    pie: result.pie,
  });
}
