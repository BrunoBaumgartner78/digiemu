import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function toCsv(rows: any[]) {
  const header = ["id", "vendorId", "vendorEmail", "amountCents", "status", "createdAt", "paidAt", "note"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const vendorEmail = r.vendor?.email ?? "";
    const vals = [r.id, r.vendorId, vendorEmail, String(r.amountCents ?? ""), r.status ?? "", r.createdAt?.toISOString?.() ?? "", r.paidAt?.toISOString?.() ?? "", (r.note ?? "").replace(/[\n\r]/g, " ")];
    lines.push(vals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const vendorId = url.searchParams.get("vendorId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined; // PENDING|PAID|CANCELLED
  const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = url.searchParams.get("dateTo") ?? undefined;
  const format = url.searchParams.get("format") ?? "json";

  const where: any = {};
  if (vendorId) where.vendorId = vendorId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) where.createdAt.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) where.createdAt.lte = d;
    }
  }

  const payouts = await prisma.payout.findMany({ where, orderBy: { createdAt: "desc" }, include: { vendor: { select: { id: true, email: true } } } });

  if (format === "csv") {
    const csv = toCsv(payouts as any[]);
    return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="payouts_${Date.now()}.csv"` } });
  }

  return NextResponse.json({ ok: true, payouts });
}
