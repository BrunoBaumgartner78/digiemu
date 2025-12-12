import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

type RouteContext = {
  params: { id?: string };
};

export async function POST(req: Request, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const userId = session.user.id;

  let productId = ctx.params?.id;

  // 🔹 Fallback: wenn params.id aus irgendeinem Grund nicht gesetzt ist,
  // lesen wir productId aus dem Request-Body
  if (!productId) {
    try {
      const body = await req.json();
      if (typeof body?.productId === "string" && body.productId.trim().length > 0) {
        productId = body.productId.trim();
      }
    } catch {
      // Body konnte nicht gelesen werden – ignorieren
    }
  }

  if (!productId) {
    return NextResponse.json(
      { error: "Missing product id" },
      { status: 400 }
    );
  }

  // 🔐 Optional: prüfen, ob Produkt existiert (damit wir keinen Müll liken)
  const productExists = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!productExists) {
    return NextResponse.json(
      { error: "Produkt existiert nicht" },
      { status: 404 }
    );
  }

  // Prüfen, ob Like schon existiert
  const existing = await prisma.like.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    // 🔄 Unlike → löschen
    await prisma.like.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  } else {
    // ❤️ Like hinzufügen
    await prisma.like.create({
      data: {
        userId,
        productId,
      },
    });
  }

  const likesCount = await prisma.like.count({
    where: { productId },
  });

  return NextResponse.json({
    isLiked: !existing,
    likesCount,
  });
}
