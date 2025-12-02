// src/app/api/vendor/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// User aus Session + DB holen
async function getDbUserFromSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return dbUser;
}

export async function POST(req: Request) {
  const dbUser = await getDbUserFromSession();

  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Nur Vendor oder Admin dürfen Produkte anlegen
  if (dbUser.role !== "VENDOR" && dbUser.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Not a vendor" },
      { status: 403 }
    );
  }

  // 🔥 Body robust einlesen: JSON ODER FormData
  const contentType = req.headers.get("content-type") || "";
  let payload: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    payload = await req.json();
  } else {
    const formData = await req.formData();
    payload = Object.fromEntries(formData.entries());
  }

  const title = String(payload.title ?? "").trim();
  const description = String(payload.description ?? "");
  const thumbnail = payload.thumbnail ? String(payload.thumbnail) : null;
  const fileUrl = payload.fileUrl ? String(payload.fileUrl) : ""; // vorerst Placeholder

  // 💰 Preis-Felder flexibel behandeln
  let priceCents: number | null = null;

  if (payload.priceCents != null && payload.priceCents !== "") {
    const v = Number(payload.priceCents);
    if (Number.isFinite(v)) {
      priceCents = v;
    }
  } else if (payload.price != null && payload.price !== "") {
    const v = Number(payload.price);
    if (Number.isFinite(v)) {
      priceCents = Math.round(v * 100); // CHF → Rappen
    }
  }

  if (!title || priceCents == null || priceCents <= 0) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid title/price" },
      { status: 400 }
    );
  }

  // 🧾 Produkt anlegen
  const product = await prisma.product.create({
    data: {
      title,
      description,
      priceCents,
      thumbnail,
      fileUrl,
      vendorId: dbUser.id,
      isActive: false, // erstmal inaktiv, z.B. bis Review
    },
  });

  return NextResponse.json({ ok: true, product }, { status: 201 });
}
