import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";
import { toErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "productId missing" }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.ACTIVE, isActive: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[admin/products/approve] ERROR", toErrorMessage(e));
    return NextResponse.json({ error: toErrorMessage(e) ?? "Internal error" }, { status: 500 });
  }
}
