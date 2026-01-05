export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromRequest } from "@/lib/tenants";

export async function POST(req: Request) {
  const tenantHit = getTenantFromRequest(req);
  if (!tenantHit) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 400 });
  }

  const { tenant, key } = tenantHit;

  const session = await getServerSession(auth);
  const user = session?.user as any | undefined;
  const userId = user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (!vendorProfile) {
    return NextResponse.json({ error: "Vendor profile not found" }, { status: 403 });
  }

  if (vendorProfile.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Vendor not approved", status: vendorProfile.status },
      { status: 403 }
    );
  }

  const body = await req.json();

  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const category = String(body?.category ?? "").trim();
  const fileUrl = String(body?.fileUrl ?? "").trim();
  const thumbnail = body?.thumbnail ? String(body.thumbnail) : null;

  let priceCents: number;
  if (typeof body?.priceCents === "number") {
    priceCents = Math.max(0, Math.floor(body.priceCents));
  } else if (typeof body?.price === "number") {
    priceCents = Math.max(0, Math.floor(body.price * 100));
  } else {
    priceCents = 0;
  }

  if (!title || !description || !category || !fileUrl) {
    return NextResponse.json(
      { error: "Missing fields", required: ["title", "description", "category", "fileUrl"] },
      { status: 400 }
    );
  }

  // --- YAML business rules ---
  if (tenant.catalogMode === "FREE_ONLY" && priceCents > 0) {
    return NextResponse.json(
      { error: "Only free products allowed", tenant: key },
      { status: 400 }
    );
  }

  if (tenant.catalogMode === "PAID_ONLY" && priceCents === 0) {
    return NextResponse.json(
      { error: "Only paid products allowed", tenant: key },
      { status: 400 }
    );
  }

  if (tenant.payments === "OFF" && priceCents > 0) {
    return NextResponse.json(
      { error: "Payments are disabled for this tenant", tenant: key },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      title,
      description,
      priceCents,
      fileUrl,
      thumbnail,
      category,
      vendorId: userId,
      vendorProfileId: vendorProfile.id,
      // status bleibt default "DRAFT"
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, productId: product.id, tenant: key });
}
