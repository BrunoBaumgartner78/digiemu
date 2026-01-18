import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getBooleanProp, getStringProp } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const session = maybe;

  const { id: userId } = await context.params;

  const bodyUnknown = await _req.json().catch(() => ({}));
  const shouldBlockValue = isRecord(bodyUnknown) ? getBooleanProp(bodyUnknown, "block") : null;
  const shouldBlock = typeof shouldBlockValue === "boolean" ? shouldBlockValue : true;
  const nextVendorStatus = shouldBlock ? "BLOCKED" : "PENDING";

  await prisma.$transaction(async (tx) => {
    // vendor profile status
    const vp = await tx.vendorProfile.findUnique({ where: { userId } });
    if (vp) {
      await tx.vendorProfile.update({
        where: { userId },
        data: { status: nextVendorStatus },
      });
    }

    // user block flag
    await tx.user.update({
      where: { id: userId },
      data: { isBlocked: shouldBlock },
    });

    // if blocking, also block products
    if (shouldBlock) {
      await tx.product.updateMany({
        where: { vendorId: userId },
        data: { status: "BLOCKED", isActive: false },
      });
    }

    return { ok: true };
  });

  return NextResponse.json({ ok: true });
}
