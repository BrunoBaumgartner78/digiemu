// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProductStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getTenantKeySafe(): Promise<string> {
  try {
    const mod = await import("@/lib/tenant-context");
    const fn = (mod as any)?.currentTenant;
    if (typeof fn === "function") {
      const t = await fn();
      const key = (t?.key || t?.tenantKey || "").toString().trim();
      return key || "DEFAULT";
    }
  } catch {
    // ignore
  }
  return "DEFAULT";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const tenantKey = await getTenantKeySafe();

  const { id } = await Promise.resolve(params);
  const productId = String(id ?? "").trim();
  if (!productId) return NextResponse.json({ message: "Missing product id" }, { status: 400 });

  // ✅ Tenant-Guard: Produkt muss zum aktuellen Tenant gehören
  const existing = await prisma.product.findUnique({
    where: { id: productId, tenantKey },
    select: { id: true, tenantKey: true },
  });

  if (!existing) {
    // 404 to avoid leaking info
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "other").trim() || "other";
  const status = String(body.status ?? "").trim();
  const thumbnail = body.thumbnail === null ? null : String(body.thumbnail ?? "").trim() || null;
  const moderationNote =
    body.moderationNote === null ? null : String(body.moderationNote ?? "").trim() || null;

  const priceCents = Number(body.priceCents);

  // ✅ Mindestpreis 1 CHF
  if (!Number.isFinite(priceCents) || priceCents < 100) {
    return NextResponse.json({ message: "Mindestpreis ist 1.00 CHF." }, { status: 400 });
  }

  if (!title || !description) {
    return NextResponse.json({ message: "Titel und Beschreibung sind erforderlich." }, { status: 400 });
  }

  if (!["ACTIVE", "DRAFT", "BLOCKED"].includes(status)) {
    return NextResponse.json({ message: "Ungültiger Status." }, { status: 400 });
  }
  // cast the validated string to the Prisma ProductStatus enum type
  const statusValue = status as unknown as ProductStatus;
  const isActive = Boolean(body.isActive);
  const finalIsActive = status === "BLOCKED" ? false : isActive;

  const updated = await prisma.product.update({
    where: { id: productId, tenantKey },
    data: {
      tenantKey,
      title,
      description,
      category,
      priceCents: Math.round(priceCents),
      thumbnail,
      status: statusValue,
      isActive: finalIsActive,
      moderationNote,
    },
    select: { id: true, status: true, isActive: true, tenantKey: true },
  });

  return NextResponse.json({ ok: true, product: updated });
}
