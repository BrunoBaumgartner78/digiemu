import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(_: any, { params }: any) {
  const comments = await prisma.comment.findMany({
    where: { productId: params.id },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: any) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      productId: params.id,
      userId: session.user.id,
      content,
    },
    include: { user: true },
  });

  return NextResponse.json(comment);
}
