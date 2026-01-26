import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminContext } from "@/lib/admin/adminRequestContext";
import { adminAudit } from "@/lib/admin/adminAudit";
import { PRODUCT_STATUSES, normalizeEnum } from "@/lib/admin/adminListUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { actorId, ipAddress, userAgent } = await requireAdminContext();
  const { id } = await ctx.params;

  let body: any = null;
  try { body = await req.json(); } catch { body = null; }

  const status = normalizeEnum(String(body?.status ?? ""), PRODUCT_STATUSES);
  if (!status) return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });

  const updated = await prisma.product.update({
    where: { id },
    data: { status },
    select: { id: true, status: true, title: true },
  });

  await adminAudit({
    actorId,
    action: "ADMIN_PRODUCT_SET_STATUS",
    targetType: "Product",
    targetId: id,
    meta: { status },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, product: updated });
}
