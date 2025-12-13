import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ✅ Next 16: params ist Promise und enthält beide Segmente (id + productId)
type Ctx = { params: Promise<{ id: string; productId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await ctx.params;

  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // Optional: Vendor darf nur eigene Produkte bearbeiten (Admin darf alles)
    // Wenn du roles hast, kannst du das aktivieren:
    // if (session.user.role === "VENDOR") {
    //   const owns = await prisma.product.findFirst({ where: { id: productId, vendorId: session.user.id } });
    //   if (!owns) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    // }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priceCents: data.priceCents,
        fileUrl: data.fileUrl,
        thumbnail: data.thumbnail,
        status: data.status,
        moderationNote: data.moderationNote,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Update failed" },
      { status: 500 }
    );
  }
}

