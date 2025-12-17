import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "NO_ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action === "unpublish" ? "unpublish" : "publish";

  const product = await prisma.product.findUnique({
    where: { id },
    select: { vendorId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const isVendor = product.vendorId === user.id;

  if (!isAdmin && !isVendor) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const data =
    action === "publish"
      ? { status: "ACTIVE", isActive: true }
      : { status: "DRAFT", isActive: false };

  const updated = await prisma.product.update({
    where: { id },
    data,
    select: {
      id: true,
      status: true,
      isActive: true,
      title: true,
      vendorId: true,
    },
  });

  return NextResponse.json({ product: updated });
}
