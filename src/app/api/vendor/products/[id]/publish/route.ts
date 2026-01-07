import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "NO_ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action === "unpublish" ? "unpublish" : "publish";

  const product = await prisma.product.findUnique({
    where: { id },
    select: { vendorId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const isVendor = product.vendorId === user.id;

  if (!isAdmin && !isVendor) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const data =
    action === "publish"
      ? { status: "ACTIVE", isActive: true }
      : { status: "DRAFT", isActive: false };

  const { tenantKey: rawTenantKey } = await currentTenant();
  const tenantKey = rawTenantKey ?? "DEFAULT";

  // Update product and maintain vendorProfile.activeProductsCount atomically
  const updated = await prisma.$transaction(async (tx) => {
    const upd = await tx.product.update({ where: { id }, data, select: { id: true, status: true, isActive: true, title: true, vendorId: true } });
    const vp = await tx.vendorProfile.findUnique({ where: { tenantKey_userId: { tenantKey, userId: upd.vendorId } }, select: { id: true, activeProductsCount: true } });
    if (vp) {
      if (action === "publish") {
        await tx.vendorProfile.update({ where: { id: vp.id }, data: { activeProductsCount: { increment: 1 } } });
      } else {
        const newCount = Math.max(0, (vp.activeProductsCount ?? 0) - 1);
        await tx.vendorProfile.update({ where: { id: vp.id }, data: { activeProductsCount: newCount } as any });
      }
    }

    return upd;
  });

  return NextResponse.json({ product: updated });
}
