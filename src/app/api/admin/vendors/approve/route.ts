import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";
import { toErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { vendorId, vendorProfileId } = await req.json();

    // Wir akzeptieren entweder vendorProfileId (bevorzugt) oder vendorId (UserId)
    if (!vendorProfileId && !vendorId) {
      return NextResponse.json(
        { error: "vendorProfileId or vendorId missing" },
        { status: 400 }
      );
    }

    if (vendorProfileId) {
      await prisma.vendorProfile.update({
        where: { id: vendorProfileId },
        data: { status: VendorStatus.APPROVED },
      });
    } else {
      await prisma.vendorProfile.update({
        where: { userId: vendorId },
        data: { status: VendorStatus.APPROVED },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[admin/vendors/approve] ERROR", toErrorMessage(e));
    return NextResponse.json({ error: toErrorMessage(e) ?? "Internal error" }, { status: 500 });
  }
}
