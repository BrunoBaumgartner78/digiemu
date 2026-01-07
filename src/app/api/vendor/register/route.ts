import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";
import { requireModeOr403 } from "@/lib/tenantModeGuard";

export async function POST(req: Request) {
  const { tenantKey, tenant } = await requireTenant(req);

  // ✅ Step 10: Mode enforcement (Vendor registration)
  const modeGate = requireModeOr403({
    tenant,
    allow: ["MARKETPLACE"],
    feature: "vendor.register",
  });
  if (!modeGate.ok) return modeGate.res;

  if (tenant.vendorOnboarding !== "OPEN_WITH_APPROVAL") {
    return NextResponse.json({ error: "Registration disabled" }, { status: 403 });
  }

  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const existing = await prisma.vendorProfile.findUnique({
    where: { tenantKey_userId: { tenantKey, userId } }, // ✅ requires @@unique([tenantKey,userId])
    select: { id: true, status: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "VendorProfile already exists", vendorProfileId: existing.id, status: existing.status },
      { status: 409 }
    );
  }

  const vp = await prisma.vendorProfile.create({
    data: { tenantKey, userId, status: "PENDING" },
    select: { id: true, status: true },
  });

  return NextResponse.json({ vendorProfileId: vp.id, status: vp.status });
}
