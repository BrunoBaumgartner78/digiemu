import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Bridge endpoint: keeps frontend calling /api/products/:id/view
// If you already have /api/product/:id/view elsewhere, this is the plural equivalent.
export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  if (!productId) {
    return NextResponse.json({ message: "Missing product id" }, { status: 400 });
  }

  const p = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!p) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
