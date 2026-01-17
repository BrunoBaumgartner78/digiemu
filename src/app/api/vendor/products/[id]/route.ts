// src/app/api/vendor/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function toInt(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export async function PATCH(_req: Request, ctx: Ctx) {
  const session = await getServerSession(auth);
  const userId = session?.user?.id as string | undefined;
  const role = session?.user?.role as string | undefined;

  if (!session || !userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const productId = String(id ?? "").trim();
  if (!productId) {
    return NextResponse.json({ message: "Missing product id" }, { status: 400 });
  }

  // Produkt + Vendor holen
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      vendorId: true,
      status: true,
      isActive: true,
      vendor: { select: { isBlocked: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Produkt nicht gefunden." }, { status: 404 });
  }

  // Nur Owner (oder Admin) darf bearbeiten
  const isAdmin = role === "ADMIN";
  const isOwner = existing.vendorId === userId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Vendor ist gesperrt -> darf nichts speichern
  if (existing.vendor?.isBlocked) {
    return NextResponse.json({ message: "Account gesperrt." }, { status: 403 });
  }

  // BLOCKED-Produkte sind hart gesperrt (Vendor kann NICHT entsperren)
  if (!isAdmin && existing.status === "BLOCKED") {
    return NextResponse.json({ message: "Produkt ist gesperrt." }, { status: 403 });
  }

  const body = await _req.json().catch(() => ({}));

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "").trim() || "other";

  if (!title) return NextResponse.json({ message: "Titel fehlt." }, { status: 400 });
  if (!description) return NextResponse.json({ message: "Beschreibung fehlt." }, { status: 400 });

  const priceCents = toInt(body.priceCents);
  if (priceCents === null || priceCents < 100) {
    return NextResponse.json({ message: "Mindestpreis ist 1.00 CHF." }, { status: 400 });
  }

  // Vendor darf status NICHT setzen.
  // Vendor darf isActive ändern – aber nur wenn nicht BLOCKED (s.o.)
  const requestedIsActive = Boolean(body.isActive);

  const thumbnailRaw = body.thumbnail;
  const thumbnail = typeof thumbnailRaw === "string" ? thumbnailRaw.trim() : "";

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      title,
      description,
      category,
      priceCents,
      isActive: requestedIsActive,
      thumbnail: thumbnail.length > 0 ? thumbnail : null,
      // status wird hier absichtlich NICHT geändert
      // moderationNote wird hier absichtlich NICHT geändert
    },
    select: { id: true, status: true, isActive: true },
  });

  return NextResponse.json({ ok: true, updated });
}
