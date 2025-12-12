import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET = Status + Count (für initiales Laden)
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const [likesCount, userLike] = await Promise.all([
      prisma.like.count({ where: { productId: id } }),
      userId
        ? prisma.like.findUnique({
            where: {
              userId_productId: { userId, productId: id },
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ok: true,
      likesCount,
      liked: !!userLike,
    });
  } catch (err) {
    console.error("[GET /api/products/[id]/like]", err);
    return NextResponse.json(
      { ok: false, message: "Fehler beim Laden der Likes." },
      { status: 500 }
    );
  }
}

// POST = Toggle (Like / Unlike)
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;

    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user || !user.id) {
      return NextResponse.json(
        { ok: false, message: "Du musst eingeloggt sein, um zu liken." },
        { status: 401 }
      );
    }

    const userId = user.id as string;

    // Nur aktive, nicht blockierte Produkte können geliked werden
    const product = await prisma.product.findFirst({
      where: {
        id,
        isActive: true,
        status: { not: "BLOCKED" },
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, message: "Produkt nicht gefunden oder nicht aktiv." },
        { status: 404 }
      );
    }

    const existing = await prisma.like.findUnique({
      where: {
        userId_productId: { userId, productId: id },
      },
    });

    let liked: boolean;

    if (existing) {
      // Already liked -> unlike
      await prisma.like.delete({
        where: {
          userId_productId: { userId, productId: id },
        },
      });
      liked = false;
    } else {
      // Noch kein Like -> anlegen
      await prisma.like.create({
        data: {
          userId,
          productId: id,
        },
      });
      liked = true;
    }

    const likesCount = await prisma.like.count({
      where: { productId: id },
    });

    return NextResponse.json({
      ok: true,
      liked,
      likesCount,
    });
  } catch (err) {
    console.error("[POST /api/products/[id]/like]", err);
    return NextResponse.json(
      { ok: false, message: "Fehler beim Aktualisieren des Likes." },
      { status: 500 }
    );
  }
}
