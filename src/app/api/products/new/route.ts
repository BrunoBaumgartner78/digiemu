import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { getErrorMessage } from "@/lib/guards";

export const dynamic = "force-dynamic";

type Body = {
  title: string;
  description: string;
  category: string;
  priceCents: number;
  fileUrl: string;
  thumbnail?: string | null;
  status?: string; // "DRAFT" | "ACTIVE" | "BLOCKED"
  // vendorId NICHT aus dem Client akzeptieren (Security)
};

export async function POST(_req: Request) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;

  // Nur Vendor darf Produkte erstellen
  if (!session || session.user?.role !== "VENDOR") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const vendorId = session.user?.id;
  if (!vendorId) return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });

  let data: Body;
  try {
    data = (await _req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  // Minimal-Validation
  if (!data.title?.trim()) {
    return NextResponse.json({ error: "Titel fehlt." }, { status: 400 });
  }
  if (!data.description?.trim()) {
    return NextResponse.json({ error: "Beschreibung fehlt." }, { status: 400 });
  }
  if (!data.category?.trim()) {
    return NextResponse.json({ error: "Kategorie fehlt." }, { status: 400 });
  }
  if (!Number.isInteger(data.priceCents) || data.priceCents <= 0) {
    return NextResponse.json({ error: "priceCents ungültig." }, { status: 400 });
  }
  if (!data.fileUrl?.trim()) {
    return NextResponse.json({ error: "fileUrl fehlt." }, { status: 400 });
  }

  // Force new products from vendors to start as DRAFT and not active.
  const status = "DRAFT";

  try {
    const product = await prisma.product.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category.trim(),
        priceCents: data.priceCents,
        fileUrl: data.fileUrl.trim(),
        thumbnail: data.thumbnail ?? null,
        status,
        vendorId, // kommt aus Session (wichtig!)
        isActive: false,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: unknown) {
    console.error("CREATE PRODUCT ERROR:", getErrorMessage(err));
    return NextResponse.json(
      { error: getErrorMessage(err) || "Fehler beim Erstellen." },
      { status: 500 }
    );
  }
}
