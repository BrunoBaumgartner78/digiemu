import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{
    id: string;        // kommt von /dashboard/edit/[id] (kannst du ignorieren)
    productId: string; // wichtig fürs Löschen
  }>;
};

export async function POST(_req: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await context.params;
  const userId = session.user.id;

  // (optional aber empfehlenswert) Nur Owner oder Admin darf löschen:
  const isAdmin = session.user.role === "ADMIN";

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, vendorId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAdmin && product.vendorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Falls du Relationen hast, die Delete blockieren, ggf. vorher dependent rows löschen.
    // Beispiel (nur falls vorhanden):
    // await prisma.like.deleteMany({ where: { productId } });
    // await prisma.comment.deleteMany({ where: { productId } });
    // await prisma.productView.deleteMany({ where: { productId } });

    const deleted = await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ success: true, product: deleted });
  } catch (err: any) {
    console.error("DELETE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
