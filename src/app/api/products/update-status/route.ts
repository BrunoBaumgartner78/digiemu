import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getBooleanProp, getErrorMessage } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  try {
    const sessionOrResp = await requireSessionApi();
    if (sessionOrResp instanceof NextResponse) return sessionOrResp;
    const session = sessionOrResp as Session;
    const userObj = isRecord(session?.user) ? session!.user as Record<string, unknown> : null;
    const userEmail = getStringProp(userObj, "email");
    if (!userEmail) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true, role: true } });
    if (!dbUser) return NextResponse.json({ message: "User not found" }, { status: 400 });

    const body: unknown = await _req.json().catch(() => ({} as unknown));
    const bodyForVendor: unknown = body;
    const productId = getStringProp(body, "productId") ?? "";
    if (!productId) return NextResponse.json({ message: "productId required" }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id: productId }, include: { vendorProfile: true } });
    if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });

    // Admins may always change status
    if (dbUser.role === "ADMIN") {
      const updates: Record<string, unknown> = {};
      const status = getStringProp(body, "status");
      const isActive = getBooleanProp(body, "isActive");
      if (status !== null) updates.status = status;
      if (isActive !== null) updates.isActive = isActive;
      const updated = await prisma.product.update({ where: { id: productId }, data: updates });
      return NextResponse.json({ ok: true, product: { id: updated.id, status: updated.status, isActive: updated.isActive } });
    }

    // Vendors may only modify their own products
    if (dbUser.role === "VENDOR") {
      if (product.vendorId !== dbUser.id) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      // Check vendor profile publish permission
      const vp = await prisma.vendorProfile.findFirst({ where: { userId: dbUser.id }, select: { status: true } });
      const canPublish = (vp?.status ?? "PENDING").toString().toUpperCase() === "APPROVED";

      // If vendor attempts to set ACTIVE or isActive true but not approved => block
      if (!canPublish) {
        if ((isRecord(body) && body.status === "ACTIVE") || (isRecord(body) && body.isActive === true)) {
          return NextResponse.json({ message: "Vendor profile not approved" }, { status: 403 });
        }
      }

      const updates: Record<string, unknown> = {};
      const status = getStringProp(bodyForVendor, "status");
      const isActive = getBooleanProp(bodyForVendor, "isActive");
      if (status !== null) updates.status = status;
      if (isActive !== null) updates.isActive = isActive;

      // Ensure vendors cannot accidentally set BLOCKED (only admins)
      if (updates.status === "BLOCKED") delete updates.status;

      const updated = await prisma.product.update({ where: { id: productId }, data: updates });
      return NextResponse.json({ ok: true, product: { id: updated.id, status: updated.status, isActive: updated.isActive } });
    }

    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  } catch (error: unknown) {
    console.error("[API /products/update-status]", getErrorMessage(error));
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
