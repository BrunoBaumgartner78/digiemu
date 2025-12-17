import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/logAuditEvent";

const ALLOWED_STATUSES = ["DRAFT", "ACTIVE", "BLOCKED"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { status?: string; moderationNote?: string | null };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof body.status !== "undefined") {
    if (!ALLOWED_STATUSES.includes(body.status as AllowedStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateData.status = body.status;
  }

  if (typeof body.moderationNote !== "undefined") {
    updateData.moderationNote =
      body.moderationNote === "" ? null : body.moderationNote;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    // Vorherigen Status laden für Idempotenz
    const before = await prisma.product.findUnique({ where: { id: params.id }, select: { status: true, vendorId: true, title: true } });
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        moderationNote: true,
        updatedAt: true,
        vendorId: true
      },
    });

    // Nur loggen, wenn Status sich geändert hat
    if (typeof body.status !== "undefined" && before && before.status !== updated.status) {
      let action = "";
      if (updated.status === "BLOCKED") action = "PRODUCT_BLOCKED";
      else if (updated.status === "ACTIVE") action = "PRODUCT_UNBLOCKED";
      if (action) {
        logAuditEvent({
          actorId: session.user.id,
          action,
          targetType: "PRODUCT",
          targetId: updated.id,
          meta: { vendorId: updated.vendorId, title: updated.title },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Product moderation error", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
