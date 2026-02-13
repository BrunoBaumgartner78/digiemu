import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const session = maybe;

  const { id } = await context.params;

  await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.BLOCKED, isActive: false },
  });

  return NextResponse.json({ ok: true });
}
