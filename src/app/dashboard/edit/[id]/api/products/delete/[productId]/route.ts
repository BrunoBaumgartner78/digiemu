import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(req: Request, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }
  const productId = params.productId;
  // Check ownership
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.vendorId !== session.user.id) {
    return NextResponse.json({ error: "Produkt nicht gefunden oder nicht berechtigt." }, { status: 404 });
  }
  try {
    // TODO: Decide if product should be deleted or just hidden
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { status: "HIDDEN" },
    });
    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fehler beim Löschen." }, { status: 500 });
  }
}
