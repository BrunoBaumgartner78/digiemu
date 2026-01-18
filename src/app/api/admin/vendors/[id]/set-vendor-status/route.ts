import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";
import { Prisma } from "@prisma/client";
import type { VendorStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["PENDING", "APPROVED", "BLOCKED"]);

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const session = maybe;
  const maybeUser = session?.user;

  const { id } = await context.params; // userId
  const raw = await _req.json().catch(() => ({} as unknown));
  const nextStatus = (isRecord(raw) ? (getStringProp(raw, "status") ?? "") : "").toUpperCase().trim();

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
        data: { status: nextStatus as VendorStatus },
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
  } catch (e: unknown) {
    console.error("[admin/vendors/set-vendor-status]", e);
    return NextResponse.json({ message: getErrorMessage(e) }, { status: 500 });
  }
}
