import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export async function GET() {
  await requireAdmin();

  const csv =
    "createdAt,productTitle,productId,buyerEmail,buyerId,vendorEmail,vendorId,id\n" +
    `${new Date().toISOString()},Mock Product,prod_mock,buyer@example.com,usr_buyer,vendor@example.com,usr_vendor,dl_mock_1\n`;

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="downloads-mock.csv"`,
      "cache-control": "no-store",
    },
  });
}
