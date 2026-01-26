import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext } from "@/lib/admin/adminRequestContext";
import { adminAudit } from "@/lib/admin/adminAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { actorId, ipAddress, userAgent } = await requireAdminContext();
  const { id: userId } = await ctx.params;

  let body: any = null;
  try { body = await req.json(); } catch { body = null; }

  const noteRaw = body?.note;
  const note =
    noteRaw === null ? null : typeof noteRaw === "string" ? noteRaw.trim().slice(0, 500) || null : null;

  const updated = await prisma.vendorProfile.update({
    where: { userId },
    data: { moderationNote: note },
    select: { userId: true, moderationNote: true },
  });

  await adminAudit({
    actorId,
    action: "ADMIN_VENDOR_SET_NOTE",
    targetType: "VendorProfile",
    targetId: userId,
    meta: { notePresent: !!note, noteLen: note?.length ?? 0 },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, vendor: updated });
}
