import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      buyerId: session.user.id, // ✅
    },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      downloadLink: true,
    },
  });

  return NextResponse.json({ orders });
}
