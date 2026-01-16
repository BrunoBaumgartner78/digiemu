import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await context.params;

  const body = await _req.json().catch(() => ({}));
  const shouldBlock = typeof body?.block === "boolean" ? body.block : true; // default: block
  const nextVendorStatus = shouldBlock ? "BLOCKED" : "PENDING";

  const result = await prisma.$transaction(async (tx) => {
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
