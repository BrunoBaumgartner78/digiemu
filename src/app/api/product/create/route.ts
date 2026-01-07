import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";
import { requireModeOr403 } from "@/lib/tenantModeGuard";

export async function POST(req: Request) {
  const { tenantKey, tenant } = await requireTenant(req);

  // ✅ Step 10: Mode enforcement (Product creation / upload)
  // NOTE: Apply the same guard to edit/delete routes too (product.update, product.delete).
  const modeGate = requireModeOr403({
    tenant,
    allow: ["MARKETPLACE"],
    feature: "product.create",
  });
  if (!modeGate.ok) return modeGate.res;

  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { tenantKey_userId: { tenantKey, userId } },
    select: { id: true, status: true },
  });

  if (!vendorProfile) return NextResponse.json({ error: "VendorProfile not found" }, { status: 403 });
  if (vendorProfile.status !== "APPROVED") return NextResponse.json({ error: "Vendor not approved" }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  // Never trust tenantKey from client
  if (body?.tenantKey) delete body.tenantKey;

  // Accept either `priceCents` OR `priceChf` from clients
  const priceCents =
    typeof body.priceCents === "number"
      ? Math.round(body.priceCents)
      : typeof body.priceChf === "number"
      ? Math.round(body.priceChf * 100)
      : 0;

  if (tenant.catalogMode === "FREE_ONLY" && priceCents > 0) {
    return NextResponse.json({ error: "Only free products allowed" }, { status: 400 });
  }
  if (tenant.catalogMode === "PAID_ONLY" && priceCents === 0) {
    return NextResponse.json({ error: "Only paid products allowed" }, { status: 400 });
  }
  if (tenant.payments === "OFF" && priceCents > 0) {
    return NextResponse.json({ error: "Payments are disabled" }, { status: 400 });
  }

  // Basic validation
  if (!String(body.title ?? "").trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }
  if (!String(body.description ?? "").trim()) {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
  }
  const fileUrlCandidate = String(body.fileUrl ?? body.downloadUrl ?? "").trim();
  if (!fileUrlCandidate) {
    return NextResponse.json({ error: "Missing fileUrl/downloadUrl" }, { status: 400 });
  }

  // IMPORTANT: vendorProfileId must be taken from the approved vendorProfile (never from request body)
  const product = await prisma.product.create({
    data: {
      tenantKey,
      vendorId: userId,
      vendorProfileId: vendorProfile.id,

      title: String(body.title ?? "").trim(),
      description: String(body.description ?? "").trim(),
      priceCents,

      fileUrl: String(body.fileUrl ?? body.downloadUrl ?? "").trim(),
      thumbnail: body.thumbnailUrl ?? body.thumbnail ?? null,
      category: String(body.category ?? "other").trim(),

      // If marketplace enforces ACTIVE, default to ACTIVE; else keep DRAFT if you want manual publish
      status: body.status ?? "ACTIVE",
      isActive: true,
    },
    select: { id: true },
  });

  return NextResponse.json({ status: "CREATED", productId: product.id });
}
