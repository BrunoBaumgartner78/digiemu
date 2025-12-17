import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/logAuditEvent";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.redirect(new URL("/admin/products", req.url));
  } catch (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 }
    );
  }
}
