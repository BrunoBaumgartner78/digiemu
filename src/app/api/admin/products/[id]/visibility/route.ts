// src/app/api/admin/products/[id]/visibility/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { getMarketplaceVisibilityDebug } from "@/lib/marketplace-visibility";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const session = maybe;

  const user = session.user;
  if (user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: { select: { isBlocked: true, email: true } },
      vendorProfile: { select: { status: true, isPublic: true } },
    },
  });

  if (!p) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const vis = getMarketplaceVisibilityDebug(p);
  return NextResponse.json({ productId: id, vis });
}
