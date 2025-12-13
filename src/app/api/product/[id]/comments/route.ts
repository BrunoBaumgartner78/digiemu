import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const comments = await prisma.comment.findMany({
    where: { productId: params.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid content" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      productId: params.id,
      userId, // ✅ direktes Feld, passt zu deinem Prisma Model
      content,
    },
    include: { user: true },
  });

  return NextResponse.json(comment);
}
