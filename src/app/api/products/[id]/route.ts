// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function json(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...(extra ?? {}) }, { status });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeCategory(v: unknown): string | undefined {
  if (!isNonEmptyString(v)) return undefined;
  return v.trim();
}

function normalizeNullableUrl(v: unknown): string | null | undefined {
  // undefined => "nicht updaten"
  // null => "löschen"
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (!isNonEmptyString(v)) return null;
  return v.trim();
}

function parsePriceCents(v: unknown): number | undefined {
  // undefined => nicht updaten
  if (v === undefined) return undefined;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

export async function PUT(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) return json("Not authenticated", 401);

  const { id } = await ctx.params;
  const pid = String(id ?? "").trim();
  if (!pid) return json("Invalid id", 400);

  // Produkt laden (inkl. vendor + status)
  const product = await prisma.product.findUnique({
    where: { id: pid },
    select: {
      id: true,
      vendorId: true,
      status: true,
      isActive: true,
    },
  });
  if (!product) return json("Not found", 404);

  // User status (blocked) check
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBlocked: true, role: true },
  });
  if (!currentUser) return json("Not authenticated", 401);
  if (currentUser.isBlocked) return json("Forbidden", 403);

  const isAdmin = currentUser.role === "ADMIN";

  // owner/admin check
  if (!isAdmin && product.vendorId !== user.id) {
    return json("Forbidden", 403);
  }

  // Product blocked => nur Admin darf ändern
  if (product.status === ProductStatus.BLOCKED && !isAdmin) {
    return json("Product is blocked", 403);
  }

  const body = await req.json().catch(() => ({} as any));

  // Partial update: nur wenn Feld vorhanden, setzen wir es.
  const data: any = {};

  if (body.title !== undefined) {
    const title = isNonEmptyString(body.title) ? body.title.trim() : "";
    if (!title) return json("Invalid title", 400);
    if (title.length > 140) return json("Title too long", 400);
    data.title = title;
  }

  if (body.description !== undefined) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    // description darf leer sein -> ok
    if (description.length > 10_000) return json("Description too long", 400);
    data.description = description;
  }

  if (body.category !== undefined) {
    const category = normalizeCategory(body.category);
    data.category = category ?? "other";
  }

  if (body.thumbnailUrl !== undefined) {
    data.thumbnail = normalizeNullableUrl(body.thumbnailUrl) ?? null;
  }

  const priceCents = parsePriceCents(body.priceChf);
  if (Number.isNaN(priceCents)) return json("Invalid priceChf", 400);
  if (priceCents !== undefined) data.priceCents = priceCents;

  if (body.isActive !== undefined) {
    const requestedActive = !!body.isActive;
    // blocked product => server erzwingt false (auch für Admin ok)
    data.isActive = product.status === ProductStatus.BLOCKED ? false : requestedActive;
  } else {
    // falls blocked, sicherstellen, dass es nicht aktiv bleibt
    if (product.status === ProductStatus.BLOCKED && product.isActive) {
      data.isActive = false;
    }
  }

  // Vendors dürfen status NICHT ändern (bleibt so)
  // Admin-Status-Updates über separate Admin Route.

  if (Object.keys(data).length === 0) {
    return json("No valid fields to update", 400);
  }

  const updated = await prisma.product.update({
    where: { id: pid },
    data,
    select: { id: true },
  });

  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) return json("Not authenticated", 401);

  const { id } = await ctx.params;
  const pid = String(id ?? "").trim();
  if (!pid) return json("Invalid id", 400);

  const product = await prisma.product.findUnique({
    where: { id: pid },
    select: { id: true, vendorId: true, status: true },
  });
  if (!product) return json("Not found", 404);

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isBlocked: true, role: true },
  });
  if (!currentUser) return json("Not authenticated", 401);
  if (currentUser.isBlocked) return json("Forbidden", 403);

  const isAdmin = currentUser.role === "ADMIN";
  if (!isAdmin && product.vendorId !== user.id) return json("Forbidden", 403);

  // blocked product => nur admin darf "löschen"/archivieren
  if (product.status === ProductStatus.BLOCKED && !isAdmin) {
    return json("Product is blocked", 403);
  }

  // „Löschen“ = soft-disable in DB: set isActive=false and keep moderation status untouched.
  await prisma.product.update({
    where: { id: pid },
    data: { isActive: false },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
