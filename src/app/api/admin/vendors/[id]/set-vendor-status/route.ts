import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["PENDING", "APPROVED", "BLOCKED"]);

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params; // userId
  const body = await _req.json().catch(() => ({}));
  const nextStatus = String(body?.status ?? "").toUpperCase().trim();

  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
  if (!ALLOWED.has(nextStatus)) {
    return NextResponse.json({ message: "Invalid status. Use PENDING | APPROVED | BLOCKED." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const vp = await tx.vendorProfile.findUnique({
        where: { userId: id },
        select: { id: true, status: true },
      });

      if (!vp) throw new Error("VendorProfile nicht gefunden.");

      const updatedVP = await tx.vendorProfile.update({
        where: { id: vp.id },
        data: { status: nextStatus as any },
        select: { id: true, status: true, isPublic: true },
      });

      // If APPROVED: ensure user role is VENDOR (unless ADMIN)
      if (nextStatus === "APPROVED") {
        const u = await tx.user.findUnique({ where: { id }, select: { role: true } });
        if (u && u.role !== "ADMIN" && u.role !== "VENDOR") {
          await tx.user.update({ where: { id }, data: { role: "VENDOR" } });
        }
      }

      // If BLOCKED: block products
      if (nextStatus === "BLOCKED") {
        await tx.product.updateMany({ where: { vendorId: id }, data: { status: "BLOCKED", isActive: false } });
      }

      return updatedVP;
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[admin/vendors/set-vendor-status]", e);
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}
