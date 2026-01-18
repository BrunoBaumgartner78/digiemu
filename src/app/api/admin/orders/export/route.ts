import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = maybe;

  const url = new URL(_req.url);
  const daysParam = url.searchParams.get("days");
  let fromDate: Date | undefined = undefined;
  if (daysParam === "7" || daysParam === "30" || daysParam === "90") {
    fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - parseInt(daysParam) + 1);
  }

  const orders = await prisma.order.findMany({
    where: fromDate ? { createdAt: { gte: fromDate } } : {},
    include: { product: true, buyer: true },
    orderBy: { createdAt: "desc" },
  });

  // CSV header
  const header = [
    "orderId",
    "dateISO",
    "productTitle",
    "buyerEmail",
    "amountCents",
    "amountCHF",
    "status",
  ];

  const rows = orders.map(order => [
    order.id,
    order.createdAt.toISOString(),
    order.product?.title ?? "",
    order.buyer?.email ?? "",
    order.amountCents,
    (order.amountCents / 100).toFixed(2),
    order.status,
  ]);

  const csv = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=orders-export.csv",
    },
  });
}
