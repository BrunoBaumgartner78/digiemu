import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: any) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const productId = params.id;
  const userId = session.user.id;

  const existing = await prisma.like.findUnique({
    where: { userId_productId: { userId, productId } }
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_productId: { userId, productId } }
    });
    return NextResponse.json({ liked: false });
  }

  await prisma.like.create({ data: { userId, productId }});
  return NextResponse.json({ liked: true });
}
