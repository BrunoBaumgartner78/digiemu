// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getString } from "@/lib/guards";
import { Prisma } from "@prisma/client";
const { ProductStatus } = Prisma;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function json(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function getUserFromSession(session: Session | null | undefined) {
  const u = session?.user as { id?: string; role?: string } | undefined;
  return {
    id: typeof u?.id === "string" ? u.id : null,
    role: typeof u?.role === "string" ? u.role : null,
  };
}

export async function PUT(req: Request, ctx: Ctx) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;

  const session = sessionOrResp as Session;
  const { id: userId, role } = getUserFromSession(session);
  if (!userId) return json("Not authenticated", 401);

  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      vendorId: true,
      status: true,
      vendor: { select: { isBlocked: true } },
    },
  });
  if (!product) return json("Not found", 404);

  // Acting user status
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBlocked: true, role: true },
  });
  if (!currentUser) return json("Not authenticated", 401);
  if (currentUser.isBlocked) return json("Forbidden", 403);

  // Vendor/Admin guard
  if (role !== "ADMIN" && product.vendorId !== userId) {
    return json("Forbidden", 403);
  }

  // If product is BLOCKED, non-admins cannot modify
  if (product.status === "BLOCKED" && role !== "ADMIN") {
    return json("Product is blocked", 403);
  }

  const body: unknown = await req.json().catch(() => ({}));

  const title = isRecord(body) ? (getString(body.title) ?? "").trim() : "";
  const description = isRecord(body) ? (getString(body.description) ?? "").trim() : "";
  const category =
    isRecord(body) && (getString(body.category) ?? "").trim()
      ? (getString(body.category) ?? "").trim()
      : "other";

  const thumbnail =
    isRecord(body) && (getString(body.thumbnailUrl) ?? "").trim()
      ? (getString(body.thumbnailUrl) ?? "").trim()
      : null;

  // priceChf -> priceCents
  let priceChf = NaN;
  if (isRecord(body)) {
    const v = (body as any).priceChf;
    if (typeof v === "number") priceChf = v;
    else if (typeof v === "string" && v.trim() !== "") priceChf = Number(v);
  }
  if (!Number.isFinite(priceChf) || priceChf < 0) {
    return json("Invalid priceChf", 400);
  }
  const priceCents = Math.round(priceChf * 100);

  const isActive = isRecord(body) ? !!(body as any).isActive : false;

  // Enforce: blocked product is never active
  const finalIsActive = product.status === "BLOCKED" ? false : isActive;

  // Vendors must NOT be able to set status here
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

export async function DELETE(_req: Request, ctx: Ctx) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;

  const session = sessionOrResp as Session;
  const { id: userId, role } = getUserFromSession(session);
  if (!userId) return json("Not authenticated", 401);

  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, vendorId: true },
  });
  if (!product) return json("Not found", 404);

  if (role !== "ADMIN" && product.vendorId !== userId) {
    return json("Forbidden", 403);
  }

  // "Löschen" = Draft + hidden
  await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.DRAFT, isActive: false },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
