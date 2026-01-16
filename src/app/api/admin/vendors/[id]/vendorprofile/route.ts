import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  status?: "PENDING" | "APPROVED" | "BLOCKED";
  isPublic?: boolean;
};

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params; // userId
  if (!id) return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });

  const body = (await _req.json().catch(() => ({}))) as Body;

  const nextStatus = body.status;
  const nextIsPublic = body.isPublic;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Ensure user exists and is vendor
      const user = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true },
      });
      if (!user) throw new Error("User not found");
      if (user.role !== "VENDOR") throw new Error("User is not a vendor");

      // Ensure vendorProfile exists
      const vp = await tx.vendorProfile.findUnique({
        where: { userId: id },
        select: { id: true, status: true, isPublic: true },
      });

      if (!vp) throw new Error("VendorProfile fehlt. Vendor muss zuerst /become-seller ausführen.");

      const data: any = {};
      if (nextStatus) data.status = nextStatus;
      if (typeof nextIsPublic === "boolean") data.isPublic = nextIsPublic;

      const newVp = await tx.vendorProfile.update({
        where: { userId: id },
        data,
        select: { id: true, status: true, isPublic: true },
      });

      return newVp;
    });

    return NextResponse.json({ ok: true, vendorProfile: updated });
  } catch (e: any) {
    console.error("[admin vendors vendorprofile]", e);
    return NextResponse.json({ ok: false, message: e?.message || "Server error" }, { status: 500 });
  }
}
