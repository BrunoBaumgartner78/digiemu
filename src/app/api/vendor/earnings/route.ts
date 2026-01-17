import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorApi } from "@/lib/guards/authz";

// TODO: use getVendorProfile for detailed earnings per vendor
// async function getVendorProfile(userId: string) {
//   return prisma.$queryRawUnsafe(
//     `SELECT * FROM "VendorProfile" WHERE "userId" = $1`,
//     userId
//   ).then(arr => (arr as unknown[])[0]);
// }


export async function GET() {
  const maybe = await requireVendorApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;
  const userId = session.user.id;
  // Alle Orders für diesen Vendor
  const orders = await prisma.order.findMany({
    where: {
      product: { vendorId: userId },
      status: "COMPLETED",
    },
    include: { product: true },
  });
  const totalGross = orders.reduce((sum, o) => sum + (o.amountCents || 0), 0);
  const vendorNet = Math.round(totalGross * 0.8);
  // Bereits ausgezahlte Beträge
  const payouts = await prisma.payout.findMany({
    where: { vendorId: userId, status: "PAID" },
  });
  const totalPaid = payouts.reduce((sum, p) => sum + (p.amountCents || 0), 0);
  const available = vendorNet - totalPaid;
  return NextResponse.json({
    ok: true,
    totalGross,
    vendorNet,
    totalPaid,
    available,
    currency: "EUR",
  });
}
