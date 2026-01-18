import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, toNumber, getErrorMessage } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPriceCents(priceChf: unknown): number | null {
  if (typeof priceChf !== "number" || !Number.isFinite(priceChf) || priceChf <= 0) return null;
  return Math.round(priceChf * 100);
}

export async function POST(_req: NextRequest) {
  try {
    const sessionOrResp = await requireSessionApi();
    if (sessionOrResp instanceof NextResponse) return sessionOrResp;
    const session = sessionOrResp as Session;
    const userObj = isRecord(session?.user) ? session!.user as Record<string, unknown> : null;
    const userEmail = getStringProp(userObj, "email");
    if (!userEmail) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // DB-User via Email (FK safe)
    const dbUser = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true, role: true, isBlocked: true } });

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
    const body: unknown = await _req.json().catch(() => ({} as unknown));
    const title = isRecord(body) ? (getStringProp(body, "title") ?? "").trim() : "";
    const description = isRecord(body) ? (getStringProp(body, "description") ?? "").trim() : "";
    const category = isRecord(body) && getStringProp(body, "category") ? (getStringProp(body, "category") ?? "other").trim() : "other";

    const fileUrl = isRecord(body) ? (getStringProp(body, "downloadUrl") ?? "").trim() : "";
    const rawPrice = isRecord(body) ? (body as Record<string, unknown>).priceChf : undefined;
    const priceCents = toPriceCents(toNumber(rawPrice));
    const thumbnail = isRecord(body) ? (getStringProp(body, "thumbnailUrl") ?? null) : null;

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
      if (!canPublish && ((isRecord(body) && body.status === "ACTIVE") || (isRecord(body) && body.isActive === true))) {
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
  } catch (error: unknown) {
    console.error("[API /products/create] Fehler:", getErrorMessage(error));
    return NextResponse.json(
      { message: "Interner Fehler beim Anlegen des Produkts." },
      { status: 500 }
    );
  }
}
