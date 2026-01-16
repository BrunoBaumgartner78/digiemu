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

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // DB-User via Email (FK safe)
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, isBlocked: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: "User nicht in DB gefunden. Bitte neu einloggen." },
        { status: 400 }
      );
    }

    if (dbUser.isBlocked) {
      return NextResponse.json({ message: "Account gesperrt." }, { status: 403 });
    }

    if (dbUser.role !== "VENDOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Body
    const body = await _req.json().catch(() => ({}));
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

    // VendorProfile rules:
    // - ADMIN: may always create (vendorProfileId optional)
    // - VENDOR: must have VendorProfile with status === APPROVED
    let vendorProfileId: string | null = null;

    let canPublish = false;
    if (dbUser.role === "VENDOR") {
      const vp = await prisma.vendorProfile.findFirst({ where: { userId: dbUser.id }, select: { id: true, status: true } });
      const status = (vp?.status ?? "PENDING").toString().toUpperCase();
      // Allow creating products for VENDORs even when PENDING, but only as DRAFT
      vendorProfileId = vp?.id ?? null;
      canPublish = status === "APPROVED";

      // If client attempts to create as ACTIVE / isActive=true while not allowed => forbid
      if (!canPublish && (body.status === "ACTIVE" || body.isActive === true)) {
        return NextResponse.json(
          { message: "Vendor profile not approved", status: vp?.status ?? "PENDING" },
          { status: 403 }
        );
      }
    }

    // ✅ Neu: Produkte starten als DRAFT und isActive=false.
    // Admin aktiviert später via Toggle (status ACTIVE + isActive=true).
    const created = await prisma.product.create({
      data: {
        title,
        description,
        category,
        fileUrl,
        priceCents,
        thumbnail,
        vendorId: dbUser.id,
        vendorProfileId, // null für ADMIN, gesetzt für approved Vendor
        // Force draft & inactive on create - publish must be done via explicit status update API
        isActive: false,
        status: "DRAFT",
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
