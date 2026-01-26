import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/guards/authz";
import type { Prisma } from "@/generated/prisma";

function toCsv(rows: unknown[]) {
  const header = ["id", "vendorId", "vendorEmail", "amountCents", "status", "createdAt", "paidAt", "note"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const rr = r as Record<string, unknown>;
    const vendor = rr.vendor as Record<string, unknown> | undefined;
    const vendorEmail = vendor ? String(vendor.email ?? "") : "";
    const id = String(rr.id ?? "");
    const vendorId = String(rr.vendorId ?? "");
    const amountCents = String(rr.amountCents ?? "");
    const status = String(rr.status ?? "");
    const createdAt = rr.createdAt instanceof Date ? rr.createdAt.toISOString() : String(rr.createdAt ?? "");
    const paidAt = rr.paidAt instanceof Date ? rr.paidAt.toISOString() : String(rr.paidAt ?? "");
    const note = String(rr.note ?? "").replace(/[\n\r]/g, " ");

    const vals = [id, vendorId, vendorEmail, amountCents, status, createdAt, paidAt, note];
    lines.push(vals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}

export async function GET(_req: Request) {
  const maybeSession = await requireAdminApi();
  if (maybeSession instanceof NextResponse) return maybeSession;
  const session = maybeSession;

  const url = new URL(_req.url);
  const vendorId = url.searchParams.get("vendorId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined; // PENDING|PAID|CANCELLED
  const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = url.searchParams.get("dateTo") ?? undefined;
  const format = url.searchParams.get("format") ?? "json";

  const whereRaw: Record<string, unknown> = {};
  if (vendorId) whereRaw.vendorId = vendorId;
  if (status) {
    const s = String(status).toUpperCase();
    const allowed = ["PENDING", "PAID", "CANCELLED"];
    if (allowed.includes(s)) {
      whereRaw.status = s;
    }
  }
  if (dateFrom || dateTo) {
    whereRaw.createdAt = {} as Record<string, unknown>;
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) (whereRaw.createdAt as Record<string, unknown>).gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) (whereRaw.createdAt as Record<string, unknown>).lte = d;
    }
  }

  const where = whereRaw as unknown as Prisma.PayoutWhereInput;

  const payouts = await prisma.payout.findMany({ where, orderBy: { createdAt: "desc" }, include: { vendor: { select: { id: true, email: true } } } });

  if (format === "csv") {
    const csv = toCsv(payouts as unknown[]);
    return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="payouts_${Date.now()}.csv"` } });
  }

  return NextResponse.json({ ok: true, payouts });
}
