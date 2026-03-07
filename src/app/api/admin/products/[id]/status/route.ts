import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext } from "@/lib/admin/adminRequestContext";
import { auditAdminMutation } from "@/lib/admin/audit";
import { PRODUCT_STATUSES, normalizeEnum } from "@/lib/admin/adminListUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// canonical admin product status endpoint

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { actorId } = await requireAdminContext();

  const { id } = await ctx.params;

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const status = normalizeEnum(String((body as Record<string, unknown>)?.status ?? ""), PRODUCT_STATUSES);
  const hasModerationNote = body !== null && typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "moderationNote");
  const moderationNoteRaw = (body as Record<string, unknown> | null)?.moderationNote;
  const moderationNote =
    moderationNoteRaw === null
      ? null
      : typeof moderationNoteRaw === "string"
        ? moderationNoteRaw.trim().slice(0, 500) || null
        : undefined;

  if (!status) return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });

  const isActive = status === "ACTIVE";

  const current = await prisma.product.findUnique({
    where: { id },
    select: { status: true, isActive: true, moderationNote: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      status,
      isActive,
      ...(hasModerationNote ? { moderationNote } : {}),
    },
    select: { id: true, status: true, isActive: true },
  });

  await auditAdminMutation({
    adminUserId: actorId,
    action: "ADMIN_PRODUCT_SET_STATUS",
    entityType: "Product",
    entityId: id,
    before: {
      status: current.status,
      isActive: current.isActive,
      moderationNote: current.moderationNote,
    },
    after: {
      status: updated.status,
      isActive: updated.isActive,
      moderationNote: hasModerationNote ? moderationNote ?? null : current.moderationNote,
    },
    note: hasModerationNote ? moderationNote ?? null : null,
    request: req,
  });

  return NextResponse.json({ ok: true, productId: updated.id, status: updated.status, isActive: updated.isActive });
}
