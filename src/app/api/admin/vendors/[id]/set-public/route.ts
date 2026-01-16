import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  isPublic?: boolean;
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Body;

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
