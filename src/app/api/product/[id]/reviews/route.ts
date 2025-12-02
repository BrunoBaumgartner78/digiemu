import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(_: any, { params }: any) {
  const reviews = await prisma.review.findMany({
    where: { productId: params.id },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(reviews);
}

export async function POST(req: Request, { params }: any) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rating, content } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: params.id
      }
    },
    update: {
      rating,
      content
    },
    create: {
      productId: params.id,
      userId: session.user.id,
      rating,
      content,
    },
    include: { user: true },
  });

  return NextResponse.json(review);
}
