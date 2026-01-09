import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MARKETPLACE_TENANT_KEY } from "@/lib/marketplaceTenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Optional: if someone hits it in browser directly, show method not allowed.
export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST" }, { status: 405 });
}

export async function POST() {
  const session = await getServerSession(auth);
  if (!session?.user || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Backfill strategy:
  // - products that should be in marketplace must have tenantKey = MARKETPLACE
  // - must have vendorProfileId pointing to an APPROVED+public vendor profile in MARKETPLACE
  //
  // Your current debug shows products are in DEFAULT with status ACTIVE.
  // We keep it safe: only update products that are ACTIVE + isActive=true and missing marketplace tenantKey.

  const mpKey = MARKETPLACE_TENANT_KEY;

  // 1) find an approved marketplace vendor profile to attach products to if needed
  const mpVendorProfile = await prisma.vendorProfile.findFirst({
    where: { tenantKey: mpKey, status: "APPROVED", isPublic: true, user: { isBlocked: false } },
    select: { id: true, userId: true },
  });

  if (!mpVendorProfile) {
    return NextResponse.json(
      { ok: false, error: "No APPROVED marketplace vendorProfile found. Approve a vendor in tenantKey=MARKETPLACE first." },
      { status: 400 }
    );
  }

  // 2) move legacy products into marketplace tenantKey and ensure vendorProfileId is set
  const res = await prisma.product.updateMany({
    where: {
      tenantKey: { in: ["DEFAULT", ""] },
      isActive: true,
      status: { in: ["ACTIVE", "PUBLISHED", "APPROVED"] }, // tolerate your existing strings
    },
    data: {
      tenantKey: mpKey,
      vendorProfileId: mpVendorProfile.id,
      vendorId: mpVendorProfile.userId,
    },
  });

  return NextResponse.json(
    { ok: true, updatedCount: res.count, marketplaceTenantKey: mpKey, vendorProfileId: mpVendorProfile.id },
    { headers: { "Cache-Control": "no-store" } }
  );
}
