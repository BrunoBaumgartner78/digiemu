// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function json(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function PUT(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) return json("Not authenticated", 401);

  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, vendorId: true, status: true, vendor: { select: { isBlocked: true } } },
  });
  if (!product) return json("Not found", 404);

  // If the acting user is blocked, deny
  const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { isBlocked: true, role: true } });
  if (!currentUser) return json("Not authenticated", 401);
  if (currentUser.isBlocked) return json("Forbidden", 403);

  if (user.role !== "ADMIN" && product.vendorId !== user.id) {
    return json("Forbidden", 403);
  }

  // If the product itself is BLOCKED, non-admins may not modify or delete it
  if (product.status === "BLOCKED" && user.role !== "ADMIN") {
    return json("Product is blocked", 403);
  }

  const body = await req.json().catch(() => ({}));

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : "other";
  const thumbnail =
    typeof body.thumbnailUrl === "string" && body.thumbnailUrl.trim()
      ? body.thumbnailUrl.trim()
      : null;

  const priceChf = Number(body.priceChf);
  if (!Number.isFinite(priceChf) || priceChf < 0) {
    return json("Invalid priceChf", 400);
  }
  const priceCents = Math.round(priceChf * 100);

  const isActive = !!body.isActive;

  // Enforce: if product.status === 'BLOCKED', server forces isActive = false
  const finalIsActive = product.status === "BLOCKED" ? false : isActive;

  // Vendors must NOT be able to set status via this route. Status changes should go through admin routes.
  const updated = await prisma.product.update({
    where: { id },
    data: {
      title,
      description,
      category,
      thumbnail,
      priceCents,
      isActive: finalIsActive,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) return json("Not authenticated", 401);

  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, vendorId: true },
  });
  if (!product) return json("Not found", 404);

  if (user.role !== "ADMIN" && product.vendorId !== user.id) {
    return json("Forbidden", 403);
  }

  // „Löschen“ = archivieren
  await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED", isActive: false },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
