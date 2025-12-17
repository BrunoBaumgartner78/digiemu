import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteCtx) {
  const { id: productId } = await ctx.params;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Toggle: existiert Like schon?
  const existing = await prisma.like.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  let liked = false;

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.like.delete({
        where: { userId_productId: { userId, productId } },
      });
      liked = false;
    } else {
      await tx.like.create({
        data: { userId, productId },
      });
      liked = true;
    }
  });

  const likesCount = await prisma.like.count({
    where: { productId },
  });

  // Optional: Server-Render Seiten frisch halten
  revalidatePath(`/product/${productId}`);
  revalidatePath(`/marketplace`);

  return NextResponse.json({ ok: true, liked, likesCount });
}
