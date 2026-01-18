import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function POST(_req: Request, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  const { requireSessionApi } = await import("@/lib/guards/authz");
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as import("next-auth").Session;
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rating, content } = await _req.json();

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId,      // ✅ string garantiert
        productId,
      },
    },
    update: {
      rating,
      content: typeof content === "string" ? content : null,
    },
    create: {
      productId,
      userId,
      rating,
      content: typeof content === "string" ? content : null,
    },
    include: { user: true },
  });

  return NextResponse.json(review);
}
