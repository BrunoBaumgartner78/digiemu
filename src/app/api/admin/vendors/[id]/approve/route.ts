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

  const result = await prisma.$transaction(async (tx) => {
    // ensure vendor profile exists
    const vp = await tx.vendorProfile.findUnique({ where: { userId } });

    if (!vp) {
      await tx.vendorProfile.create({
        data: { userId, displayName: "Vendor", bio: "", status: "APPROVED" },
      });
    } else {
      await tx.vendorProfile.update({
        where: { userId },
        data: { status: "APPROVED" },
      });
    }

    // ensure user not blocked
    await tx.user.update({
      where: { id: userId },
      data: { isBlocked: false, role: "VENDOR" },
    });

    return { ok: true };
  });
  return NextResponse.json(result === null ? { ok: true } : { ok: true });
}
