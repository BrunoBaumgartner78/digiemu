import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

/**
 * POST /api/admin/maintenance/backfill-products
 * Fixes old products so they can appear in Marketplace (Option B).
 */
export async function POST(req: Request) {
  const session = await getServerSession(auth);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  const { tenantKey: detectedTenantKey } = await currentTenant();
  const tenantKey = String(body?.tenantKey ?? detectedTenantKey ?? "DEFAULT").trim() || "DEFAULT";
  const onlyMissing = body?.onlyMissing !== false; // default true

  // Load vendorProfiles for this tenant keyed by userId
  const vendorProfiles = await prisma.vendorProfile.findMany({
    where: { tenantKey },
    select: { id: true, userId: true, status: true, isPublic: true },
  });

  const vpByUserId = new Map<string, { id: string; status: string; isPublic: boolean }>();
  for (const vp of vendorProfiles) {
    vpByUserId.set(vp.userId, { id: vp.id, status: vp.status, isPublic: vp.isPublic });
  }

  // Find products that are candidates for backfill
  // Note: `vendorProfileId` is non-nullable in schema; legacy missing values are empty string.
  const products = await prisma.product.findMany({
    where: {
      ...(onlyMissing
        ? {
            OR: [
              { vendorProfileId: "" },
              { tenantKey: { equals: "" } },
              { tenantKey: { equals: "DEFAULT" } },
            ],
          }
        : {}),
    },
    select: { id: true, vendorId: true, vendorProfileId: true, tenantKey: true, status: true },
  });

  let updatedCount = 0;
  let skippedNoProfile = 0;

  for (const p of products) {
    const vp = vpByUserId.get(p.vendorId);
    if (!vp) {
      skippedNoProfile++;
      continue;
    }

    const canBeActive = vp.status === "APPROVED" && vp.isPublic === true;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        tenantKey: p.tenantKey && p.tenantKey.trim().length > 0 ? p.tenantKey : tenantKey,
        vendorProfileId: p.vendorProfileId && p.vendorProfileId.trim().length > 0 ? p.vendorProfileId : vp.id,
        status: canBeActive ? "ACTIVE" : p.status,
        isActive: true,
      },
    });

    updatedCount++;
  }

  return NextResponse.json({
    ok: true,
    tenantKey,
    updatedCount,
    skippedNoProfile,
    totalChecked: products.length,
  });
}
