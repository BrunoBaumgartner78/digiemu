import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import {
  isRecord,
  getStringProp,
  getNumberProp,
  getBooleanProp,
  toNumber,
  getErrorMessage,
} from "@/lib/guards";

export async function POST(_req: Request) {
  try {
    const sessionOrResp = await requireSessionApi();
    if (sessionOrResp instanceof NextResponse) return sessionOrResp;
    const session = sessionOrResp as Session;
    const user = isRecord(session?.user) ? session!.user as Record<string, unknown> : null;
    const userId = getStringProp(user, "id");
    const role = getStringProp(user, "role");

    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await _req.json().catch(() => ({}));
    const productId = getStringProp(body, "id");
    if (!productId) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const existing = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, vendorId: true, status: true } });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isAdmin = role === "ADMIN";
    const isVendorOwner = existing.vendorId === userId;
    if (!isAdmin && !isVendorOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    if (existing.status === "BLOCKED" && !isAdmin) {
      return NextResponse.json({ message: "Dieses Produkt ist gesperrt und kann nicht bearbeitet werden." }, { status: 403 });
    }

    // Vendor darf niemals BLOCKED setzen/ändern
    const requestedStatus = getStringProp(body, "status");
    if (!isAdmin) {
      if (requestedStatus === "BLOCKED") return NextResponse.json({ message: "Forbidden status change" }, { status: 403 });
      if (requestedStatus && !["DRAFT", "ACTIVE"].includes(requestedStatus)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    // build update object with allowlist
    const updateData: Record<string, unknown> = {};
    const title = getStringProp(body, "title");
    const description = getStringProp(body, "description");
    const category = getStringProp(body, "category");
    const moderationNote = isAdmin ? getStringProp(body, "moderationNote") : null;

    if (title !== null) updateData.title = title;
    if (description !== null) updateData.description = description;
    if (category !== null) updateData.category = category;
    if (moderationNote !== null) updateData.moderationNote = moderationNote;

    // Preis-Validierung (min 1 CHF)
    if (body !== undefined && Object.prototype.hasOwnProperty.call(body, "priceChf")) {
      const n = toNumber((body as Record<string, unknown>).priceChf);
      if (n === null || n < 1) return NextResponse.json({ message: "Mindestpreis ist 1.00 CHF" }, { status: 400 });
      updateData.priceCents = Math.round(n * 100);
    }

    if (requestedStatus && (isAdmin || ["DRAFT", "ACTIVE"].includes(requestedStatus))) {
      updateData.status = requestedStatus;
    }

    const updated = await prisma.product.update({ where: { id: productId }, data: updateData });
    return NextResponse.json({ ok: true, updated });
  } catch (err: unknown) {
    console.error("❌ products.update error:", getErrorMessage(err));
    return NextResponse.json({ message: "server_error" }, { status: 500 });
  }
}
