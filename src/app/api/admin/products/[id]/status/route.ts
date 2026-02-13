import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const session = maybe;

  const user = session.user;
  if (user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  const body = await _req.json().catch(() => ({}));
  const status = String(body.status ?? "").toUpperCase();
  const isActive = !!body.isActive;

  if (![ProductStatus.ACTIVE, ProductStatus.DRAFT, ProductStatus.BLOCKED].includes(status as (typeof ProductStatus)[keyof typeof ProductStatus])) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  // Consistency rule: BLOCKED => not active
  const safeIsActive = status === "BLOCKED" ? false : isActive;

  const updated = await prisma.product.update({
    where: { id },
    data: { status: status as (typeof ProductStatus)[keyof typeof ProductStatus], isActive: safeIsActive },
    select: { id: true, status: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}
