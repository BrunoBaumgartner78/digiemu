// src/app/api/products/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    // 1) Session prüfen
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { ok: false, message: "Nicht eingeloggt oder keine gültige Session." },
        { status: 401 }
      );
    }

    // 2) Body auslesen
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
      downloadUrl,
      thumbnailUrl,
      category, // 🔹 kommt von der NewProductPage
    } = body;

    // 3) Validierung
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { ok: false, message: "Titel fehlt oder ist ungültig." },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { ok: false, message: "Beschreibung fehlt oder ist ungültig." },
        { status: 400 }
      );
    }

    const priceNumber = Number(priceChf);
    if (!priceNumber || priceNumber <= 0) {
      return NextResponse.json(
        { ok: false, message: "Preis (CHF) fehlt oder ist ungültig." },
        { status: 400 }
      );
    }

    if (!downloadUrl || typeof downloadUrl !== "string") {
      return NextResponse.json(
        { ok: false, message: "Download-URL fehlt oder ist ungültig." },
        { status: 400 }
      );
    }

    // 🔹 Kategorie „säubern“
    const finalCategory =
      typeof category === "string" && category.trim().length > 0
        ? category.trim()
        : "other"; // Fallback-Kategorie

    const priceCents = Math.round(priceNumber * 100);

    // 4) Produkt anlegen – nur existierende Felder aus dem Prisma-Model
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        priceCents,
        fileUrl: downloadUrl,                // Firebase-Link für die Produktdatei
        thumbnail: thumbnailUrl || null,
        category: finalCategory,             // 🔹 HIER wird die Kategorie gesetzt
        vendorId: session.user.id as string,
        isActive: true,                      // neu angelegte Produkte sind aktiv
        status: "ACTIVE",                    // und nicht als DRAFT/ BLOCKED markiert
      },
      select: {
        id: true,
        title: true,
        category: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Produkt erfolgreich angelegt.",
        product,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[API /products/create] Fehler:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Interner Fehler beim Anlegen des Produkts.",
      },
      { status: 500 }
    );
  }
}
