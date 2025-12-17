// src/app/dashboard/edit/[id]/api/products/delete/[productId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  // Optional: Ownership check (Vendor darf nur eigene Produkte löschen)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, vendorId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Admin darf immer, Vendor nur wenn owner
  const isAdmin = session?.user?.role === "ADMIN";
  if (!isAdmin && product.vendorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ Transaction als Callback -> kein PrismaPromise-Problem mehr
  await prisma.$transaction(async (tx) => {
    // Wenn FK-Constraints: zuerst abhängige Datensätze löschen
    // (Nur die Models drin lassen, die du wirklich hast.)
    await tx.like.deleteMany({ where: { productId } }).catch(() => {});
    await tx.comment.deleteMany({ where: { productId } }).catch(() => {});
    await tx.review.deleteMany({ where: { productId } }).catch(() => {});
    await tx.productView.deleteMany({ where: { productId } }).catch(() => {});

    // ⚠️ Orders: meistens NICHT löschen (Audit/Belege).
    // Wenn dein Schema Orders FK-hard an Product hängt, musst du das sauber lösen:
    // - entweder Order.productId nullable machen + auf null setzen
    // - oder ON DELETE SET NULL/CASCADE im Prisma Schema/DB
    // Ich lasse Orders hier absichtlich unangetastet.

    await tx.product.delete({ where: { id: productId } });
  });

  return NextResponse.json({ ok: true });
}
