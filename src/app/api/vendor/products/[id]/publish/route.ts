import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBooleanProp, getStringProp, getErrorMessage, isRecord } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = isRecord(session?.user) ? session!.user as Record<string, unknown> : null;
    const userId = getStringProp(user, "id");
    const userRole = getStringProp(user, "role");

    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "NO_ID" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const publishFlag = getBooleanProp(body, "publish");
    // support legacy action string
    const actionStr = getStringProp(body, "action");
    const doPublish = publishFlag === null ? actionStr !== "unpublish" : publishFlag;

    const product = await prisma.product.findUnique({ where: { id }, select: { vendorId: true } });
    if (!product) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const isAdmin = userRole === "ADMIN";
    const isVendorOwner = product.vendorId === userId;
    if (!isAdmin && !isVendorOwner) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const updated = await prisma.product.update({
      where: { id },
      data: doPublish ? { status: "ACTIVE", isActive: true } : { status: "DRAFT", isActive: false },
      select: { id: true, status: true, isActive: true, title: true, vendorId: true },
    });

    return NextResponse.json({ product: updated });
  } catch (err: unknown) {
    console.error("❌ vendor publish error:", getErrorMessage(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
