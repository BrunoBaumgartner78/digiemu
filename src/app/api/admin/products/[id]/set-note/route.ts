import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext } from "@/lib/admin/adminRequestContext";
import { auditAdminMutation } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { actorId } = await requireAdminContext();
  const { id } = await ctx.params;

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const moderationNoteRaw = (body as Record<string, unknown>)?.moderationNote;
  const moderationNote =
    moderationNoteRaw === null
      ? null
      : typeof moderationNoteRaw === "string"
        ? moderationNoteRaw.trim().slice(0, 500) || null
        : null;

  const current = await prisma.product.findUnique({
    where: { id },
    select: { moderationNote: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { moderationNote },
    select: { id: true, moderationNote: true },
  });

  await auditAdminMutation({
    adminUserId: actorId,
    action: "ADMIN_PRODUCT_SET_NOTE",
    entityType: "Product",
    entityId: id,
    before: { moderationNote: current.moderationNote },
    after: { moderationNote: updated.moderationNote },
    note: updated.moderationNote,
    request: req,
  });

  return NextResponse.json({ ok: true, productId: updated.id, moderationNote: updated.moderationNote });
}
