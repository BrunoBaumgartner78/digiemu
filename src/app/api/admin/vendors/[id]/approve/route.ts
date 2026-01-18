import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const session = maybe;
  const maybeUser = session?.user;

  const { id: userId } = await context.params;

  await prisma.$transaction(async (tx) => {
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

  return NextResponse.json({ ok: true });
}
