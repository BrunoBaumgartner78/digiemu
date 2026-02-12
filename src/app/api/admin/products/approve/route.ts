import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
const { ProductStatus } = Prisma;

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
  } catch (e: any) {
    console.error("[admin/products/approve] ERROR", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
