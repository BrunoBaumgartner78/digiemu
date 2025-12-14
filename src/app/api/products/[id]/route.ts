// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>; // ✅ Next.js 16: params ist ein Promise
};

// 🔹 Produkt aktualisieren (Titel, Beschreibung, Preis, Kategorie, Thumbnail, isActive)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Produkt-ID fehlt." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { ok: false, message: "Nicht eingeloggt." },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    const userRole = (session.user as any).role ?? "BUYER";

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, message: "Ungültiger Request-Body." },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      priceChf,
      category,
      thumbnailUrl,
      isActive,
    } = body as {
      title?: string;
      description?: string;
      priceChf?: number;
      category?: string;
      thumbnailUrl?: string | null;
      isActive?: boolean;
    };

    // 🔍 Produkt holen, um Vendor zu prüfen
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { vendorId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, message: "Produkt nicht gefunden." },
        { status: 404 }
      );
    }

    // 🔐 Nur Vendor oder Admin darf das Produkt bearbeiten
    if (existing.vendorId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { ok: false, message: "Keine Berechtigung für dieses Produkt." },
        { status: 403 }
      );
    }

    // 🔢 Preis prüfen
    if (typeof priceChf !== "number" || !Number.isFinite(priceChf) || priceChf < 0) {
      return NextResponse.json(
        { ok: false, message: "Ungültiger Preis (CHF)." },
        { status: 400 }
      );
    }
    const priceCents = Math.round(priceChf * 100);

    const safeTitle = (title ?? "").trim();
    const safeDescription = (description ?? "").trim();
    const safeCategory = (category ?? "other").trim() || "other";

    if (!safeTitle) {
      return NextResponse.json(
        { ok: false, message: "Titel darf nicht leer sein." },
        { status: 400 }
      );
    }

    // 🔁 Status anhand von isActive setzen
    const activeBool = Boolean(isActive);
    const status = activeBool ? "ACTIVE" : "DRAFT";

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: safeTitle,
        description: safeDescription,
        priceCents,
        category: safeCategory,
        thumbnail: thumbnailUrl ?? null,
        isActive: activeBool,
        status,
      },
      select: {
        id: true,
        title: true,
        priceCents: true,
        category: true,
        thumbnail: true,
        isActive: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Produkt aktualisiert.",
        product: updated,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[PUT /api/products/[id]] Error", err);
    return NextResponse.json(
      { ok: false, message: "Interner Serverfehler beim Aktualisieren." },
      { status: 500 }
    );
  }
}
