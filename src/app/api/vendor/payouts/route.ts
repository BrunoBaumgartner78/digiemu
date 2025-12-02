import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Hilfsfunktion: VendorProfile für eingeloggten User holen
async function getVendorProfile(userId: string) {
  return prisma.$queryRawUnsafe(
    `SELECT * FROM "VendorProfile" WHERE "userId" = $1`,
    userId
  ).then(arr => (arr as unknown[])[0]);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "VENDOR") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const vendorProfile = await getVendorProfile(session.user.id);
  if (!vendorProfile) {
    return NextResponse.json({ ok: false, error: "No VendorProfile" }, { status: 403 });
  }
  // Payouts holen
  const res = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Payout" WHERE "vendorId" = $1 ORDER BY "createdAt" DESC`,
    session.user.id
  );
  return NextResponse.json({ ok: true, payouts: Array.isArray(res) ? res : [res] });
}
