import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params; // userId
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  try {
    const vp = await prisma.vendorProfile.findUnique({
      where: { userId: id },
      select: { id: true, isPublic: true },
    });

    if (!vp) {
      return NextResponse.json(
        { message: "VendorProfile nicht gefunden." },
        { status: 404 }
      );
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: vp.id },
      data: { isPublic: !vp.isPublic },
      select: { id: true, isPublic: true },
    });

    return NextResponse.json({ ok: true, vendorProfile: updated });
  } catch (e: any) {
    console.error("[admin/vendors/toggle-public]", e);
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}
