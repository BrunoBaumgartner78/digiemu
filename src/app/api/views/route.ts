// src/app/api/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

async function ensureProduct(productId: string) {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  return !!p;
}

// ✅ Debug: /api/views?productId=xxx  -> returns count
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId")?.trim() ?? "";
  if (!productId) return json(false, { error: "Missing productId" }, 400);

  const exists = await ensureProduct(productId);
  if (!exists) return json(false, { error: "Product not found" }, 404);

  const count = await prisma.productView.count({ where: { productId } });
  return json(true, { productId, count });
}

// ✅ Tracker: POST { productId }
export async function POST(req: NextRequest) {
  let productId = "";

  try {
    const body = await req.json().catch(() => ({}));
    productId = String(body?.productId ?? "").trim();
  } catch {}

  if (!productId) return json(false, { error: "Missing productId" }, 400);

  const exists = await ensureProduct(productId);
  if (!exists) return json(false, { error: "Product not found" }, 404);

  const session = await getServerSession(auth);
  const viewerId = ((session?.user as any)?.id as string | undefined) ?? null;

  // ✅ Wichtig: schreibt IMMER eine Row (damit _count.views steigt)
  const created = await prisma.productView.create({
    data: {
      productId,
      viewerId,
    },
    select: { id: true, createdAt: true },
  });

  const count = await prisma.productView.count({ where: { productId } });

  return json(true, { created, count });
}
