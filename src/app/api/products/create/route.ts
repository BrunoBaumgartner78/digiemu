import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPriceCents(priceChf: unknown): number | null {
  if (typeof priceChf !== "number" || !Number.isFinite(priceChf) || priceChf <= 0) return null;
  return Math.round(priceChf * 100);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ DB-User über Email holen → garantiert FK korrekt
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: "User nicht in DB gefunden (FK Problem). Bitte neu einloggen oder seed prüfen." },
        { status: 400 }
      );
    }

    if (dbUser.role !== "VENDOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category =
      typeof body.category === "string" && body.category.trim() ? body.category.trim() : "other";

    const fileUrl = typeof body.downloadUrl === "string" ? body.downloadUrl.trim() : "";
    const priceCents = toPriceCents(body.priceChf);
    const thumbnail =
      typeof body.thumbnailUrl === "string" && body.thumbnailUrl.trim()
        ? body.thumbnailUrl.trim()
        : null;

    if (!title) return NextResponse.json({ message: "Titel fehlt." }, { status: 400 });
    if (!description) return NextResponse.json({ message: "Beschreibung fehlt." }, { status: 400 });
    if (!fileUrl) return NextResponse.json({ message: "Download-URL fehlt." }, { status: 400 });
    if (priceCents === null) return NextResponse.json({ message: "Ungültiger Preis." }, { status: 400 });

    const created = await prisma.product.create({
      data: {
        title,
        description,
        category,
        fileUrl,
        priceCents,
        thumbnail,
        vendorId: dbUser.id,     // ✅ FIX: echte DB-User-ID
        isActive: true,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (err: any) {
    console.error("[API /products/create] Fehler:", err);
    return NextResponse.json(
      { message: "Interner Fehler beim Anlegen des Produkts." },
      { status: 500 }
    );
  }
}
