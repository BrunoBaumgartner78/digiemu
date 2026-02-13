import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext } from "@/lib/admin/adminRequestContext";
import { adminAudit } from "@/lib/admin/adminAudit";
import { VENDOR_STATUSES, normalizeEnum } from "@/lib/admin/adminListUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { actorId, ipAddress, userAgent } = await requireAdminContext();
  const { id: userId } = await ctx.params;

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const status = normalizeEnum(String((body as Record<string, unknown>)?.status ?? ""), VENDOR_STATUSES);
  if (!status) return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });

  const updated = await prisma.vendorProfile.update({
    where: { userId },
    data: { status },
    select: { userId: true, status: true, displayName: true },
  });

  await adminAudit({
    actorId,
    action: "ADMIN_VENDOR_SET_STATUS",
    targetType: "VendorProfile",
    targetId: userId,
    meta: { status },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, vendor: updated });
}
