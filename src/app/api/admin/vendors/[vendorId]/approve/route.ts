import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export async function POST(req: Request, ctx: { params: Promise<{ vendorId: string }> }) {
  const session = await getServerSession(auth);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendorId } = await ctx.params;
  if (!vendorId) {
    return NextResponse.json({ error: "Missing vendorId param" }, { status: 400 });
  }

  // Optional but recommended: only update within current tenant
  const { tenantKey: rawTenantKey } = await currentTenant();
  const tenantKey = rawTenantKey ?? "DEFAULT";

  const updated = await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: { status: "APPROVED" },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, updated }, { headers: { "Cache-Control": "no-store" } });
}
