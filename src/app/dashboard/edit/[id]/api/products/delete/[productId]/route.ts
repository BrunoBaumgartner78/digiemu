import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ✅ Next 16: params ist Promise und enthält beide Segmente (id + productId)
type Ctx = { params: Promise<{ id: string; productId: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await ctx.params;

  try {
    // Optional: Ownership/Role Check (wenn du willst)
    // z.B. nur Vendor darf eigene Produkte löschen oder Admin alles:
    // const me = session.user;
    // if (me.role === "VENDOR") {
    //   const owns = await prisma.product.findFirst({ where: { id: productId, vendorId: me.id } });
    //   if (!owns) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    // }

    // Wenn du FK-Constraints hast: erst abhängige Datensätze löschen
    await prisma.$transaction([
      prisma.like.deleteMany({ where: { productId } }),
      prisma.comment.deleteMany({ where: { productId } }),
      prisma.review.deleteMany({ where: { productId } }),
      prisma.productView.deleteMany({ where: { productId } }).catch(() => undefined as any),
      prisma.order.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
