import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext } from "@/lib/admin/adminRequestContext";
import { adminAudit } from "@/lib/admin/adminAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { actorId, ipAddress, userAgent } = await requireAdminContext();
  const { id } = await ctx.params;

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const noteRaw = (body as Record<string, unknown>)?.note;
  const note =
    noteRaw === null ? null : typeof noteRaw === "string" ? noteRaw.trim().slice(0, 500) || null : null;

  const updated = await prisma.product.update({
    where: { id },
    data: { moderationNote: note },
    select: { id: true, moderationNote: true, title: true },
  });

  await adminAudit({
    actorId,
    action: "ADMIN_PRODUCT_SET_NOTE",
    targetType: "Product",
    targetId: id,
    meta: { notePresent: !!note, noteLen: note?.length ?? 0 },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, product: updated });
}
