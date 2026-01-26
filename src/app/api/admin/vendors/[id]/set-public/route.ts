import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  isPublic?: boolean;
};

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id: userId } = await context.params;
  const body = (await _req.json().catch(() => ({}))) as Body;

  // Ensure VendorProfile exists
  const vp = await prisma.vendorProfile.findUnique({ where: { userId }, select: { id: true, isPublic: true } });

  if (!vp) {
    return NextResponse.json(
      { ok: false, message: "VendorProfile not found for this user. Use approve first." },
      { status: 404 }
    );
  }

  const nextPublic = typeof body.isPublic === "boolean" ? body.isPublic : !vp.isPublic;

  await prisma.vendorProfile.update({ where: { userId }, data: { isPublic: nextPublic } });
  return NextResponse.json({ ok: true });
}
