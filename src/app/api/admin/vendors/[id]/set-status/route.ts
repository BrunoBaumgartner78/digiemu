import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { status?: "PENDING" | "APPROVED" | "BLOCKED" };

export async function POST(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const session = maybe;

  const userId = context.params.id;

  const body = (await _req.json().catch(() => ({}))) as Body;
  const status = body.status;

  if (status !== "PENDING" && status !== "APPROVED" && status !== "BLOCKED") {
    return NextResponse.json(
      { ok: false, message: "Invalid status" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const isBlocked = status === "BLOCKED";
  const vpIsPublic = status === "APPROVED"; // Marketplace verlangt isPublic=true wenn APPROVED

  await prisma.$transaction(async (tx) => {
    // Ensure VendorProfile exists
    const vp = await tx.vendorProfile.findUnique({ where: { userId } });

    if (!vp) {
      await tx.vendorProfile.create({
        data: {
          userId,
          displayName: "Vendor",
          bio: "",
          status,
          isPublic: vpIsPublic,
        },
      });
    } else {
      await tx.vendorProfile.update({
        where: { userId },
        data: {
          status,
          isPublic: vpIsPublic,
        },
      });
    }

    // Sync user block
    await tx.user.update({
      where: { id: userId },
      data: { isBlocked },
    });

    // If blocked => block all products (and hide them)
    if (isBlocked) {
      await tx.product.updateMany({
        where: { vendorId: userId },
        data: {
          status: "BLOCKED",
          isActive: false,
        },
      });
    }
  });

  return NextResponse.json(
    { ok: true, status, isBlocked },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
