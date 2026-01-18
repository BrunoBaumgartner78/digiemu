import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  status?: "ACTIVE" | "DRAFT" | "BLOCKED";
  note?: string | null;
};

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const session = maybe;

  const { id } = await context.params;

  const body = (await _req.json().catch(() => ({}))) as Body;
  const status = body.status;

  if (status !== ProductStatus.ACTIVE && status !== ProductStatus.DRAFT && status !== ProductStatus.BLOCKED) {
    return NextResponse.json({ ok: false, message: "Invalid status" }, { status: 400 });
  }

  const isActive = status === "ACTIVE";

  await prisma.product.update({
    where: { id },
    data: {
      status: status as ProductStatus,
      isActive,
      ...(isActive ? { isPublic: true } : {}),
      moderationNote: body.note === undefined ? undefined : body.note,
    },
  });

  // Minimal response for admin toggles
  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
