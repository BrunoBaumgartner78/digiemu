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

  if (tenant.vendorOnboarding !== "OPEN_WITH_APPROVAL") {
    return NextResponse.json(
      { error: "Vendor registration disabled for this tenant", tenant: key },
      { status: 403 }
    );
  }

  const session = await getServerSession(auth);
  const user = session?.user as any | undefined;
  const userId = user?.id as string | undefined;
  const role = user?.role as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden (not a vendor)" }, { status: 403 });
  }

  const existing = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (existing) {
    return NextResponse.json({ vendorProfileId: existing.id, status: existing.status });
  }

  const created = await prisma.vendorProfile.create({
    data: { userId },
    select: { id: true, status: true },
  });

  return NextResponse.json({ vendorProfileId: created.id, status: created.status });
}
