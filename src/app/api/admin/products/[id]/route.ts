// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const session = maybe;
  const user = session.user;

  const { id } = await Promise.resolve(params);
  const productId = String(id ?? "").trim();
  if (!productId) {
    return NextResponse.json({ message: "Missing product id" }, { status: 400 });
  }

  const body = await _req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "other").trim() || "other";
  const status = String(body.status ?? "").trim();
  const thumbnail =
    body.thumbnail === null ? null : String(body.thumbnail ?? "").trim() || null;
  const moderationNote =
    body.moderationNote === null
      ? null
      : String(body.moderationNote ?? "").trim() || null;

  const priceCents = Number(body.priceCents);

  // ✅ Mindestpreis 1 CHF
  if (!Number.isFinite(priceCents) || priceCents < 100) {
    return NextResponse.json(
      { message: "Mindestpreis ist 1.00 CHF." },
      { status: 400 }
    );
  }

  if (!title || !description) {
    return NextResponse.json(
      { message: "Titel und Beschreibung sind erforderlich." },
      { status: 400 }
    );
  }

  if (![ProductStatus.ACTIVE, ProductStatus.DRAFT, ProductStatus.BLOCKED].includes(status as (typeof ProductStatus)[keyof typeof ProductStatus])) {
    return NextResponse.json(
      { message: "Ungültiger Status." },
      { status: 400 }
    );
  }

  const isActive = Boolean(body.isActive);
  const finalIsActive = status === "BLOCKED" ? false : isActive;

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      title,
      description,
      category,
      priceCents: Math.round(priceCents),
      thumbnail,
      status: status as (typeof ProductStatus)[keyof typeof ProductStatus],
      isActive: finalIsActive,
      moderationNote,
    },
    select: { id: true, status: true, isActive: true },
  });

  return NextResponse.json({ ok: true, product: updated });
}
