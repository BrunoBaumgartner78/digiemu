import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Nur Vendor darf Produkte erstellen
  if (!session || (session.user as any)?.role !== "VENDOR") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const vendorId = (session.user as any)?.id as string;

  let data: Body;
  try {
    data = (await req.json()) as Body;
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

  const status = data.status ?? "DRAFT";

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
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    console.error("CREATE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Fehler beim Erstellen." },
      { status: 500 }
    );
  }
}
