import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sales = await prisma.order.findMany({
    include: {
      product: true,
      buyer: true,
    },
  });

  const header = "id,product,buyer,amountCHF,date\n";

  const rows = sales
    .map(
      (s) =>
        `${s.id},${s.product.title},${s.buyer?.email ?? ""},${(
          s.amountCents / 100
        ).toFixed(2)},${s.createdAt.toISOString()}`
    )
    .join("\n");

  const csv = header + rows;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition":
        "attachment; filename=sales-export.csv",
    },
  });
}
