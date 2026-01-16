import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await _req.json();
  const productId = String(body.id ?? "").trim();
  if (!productId) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, vendorId: true, status: true },
  });

  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const isAdmin = role === "ADMIN";
  const isVendorOwner = existing.vendorId === userId;

  // Vendor darf nur eigene Produkte ändern
  if (!isAdmin && !isVendorOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // 🔒 Wenn Produkt BLOCKED ist: nur Admin darf überhaupt ändern
  if (existing.status === "BLOCKED" && !isAdmin) {
    return NextResponse.json(
      { message: "Dieses Produkt ist gesperrt und kann nicht bearbeitet werden." },
      { status: 403 }
    );
  }

  // 🔒 Vendor darf niemals BLOCKED setzen/ändern
  if (!isAdmin) {
    if (body.status === "BLOCKED") {
      return NextResponse.json({ message: "Forbidden status change" }, { status: 403 });
    }
    // optional: Vendor darf Status nur zwischen DRAFT/ACTIVE wechseln
    if (body.status && !["DRAFT", "ACTIVE"].includes(body.status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
  }

  // updateData whitelisten (sehr wichtig)
  const updateData: any = {
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? "").trim(),
    category: String(body.category ?? "").trim(),
    moderationNote: isAdmin ? (body.moderationNote ?? null) : undefined,
  };

  // Preis-Validierung Beispiel (min 1 CHF)
  if (body.priceChf !== undefined) {
    const n = Number(String(body.priceChf).replace(",", "."));
    if (!Number.isFinite(n) || n < 1) {
      return NextResponse.json({ message: "Mindestpreis ist 1.00 CHF" }, { status: 400 });
    }
    updateData.priceCents = Math.round(n * 100);
  }

  // status nur Admin oder Vendor erlaubt (DRAFT/ACTIVE)
  if (body.status && (isAdmin || ["DRAFT", "ACTIVE"].includes(body.status))) {
    updateData.status = body.status;
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  return NextResponse.json({ ok: true, updated });
}
