import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/logAuditEvent";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = maybe;

  try {
    // Vorherige Daten für Logging holen
    const before = await prisma.product.findUnique({ where: { id: params.id }, select: { vendorId: true, title: true } });
    await prisma.product.delete({
      where: { id: params.id },
    });
    // Audit log (fire-and-forget)
    if (before) {
      logAuditEvent({
        actorId: session.user.id,
        action: "PRODUCT_DELETED",
        targetType: "PRODUCT",
        targetId: params.id,
        meta: { vendorId: before.vendorId, title: before.title },
      });
    }
    // For forms, redirect back to admin products page
    return NextResponse.redirect(new URL("/admin/products", _req.url));
  } catch (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 }
    );
  }
}
