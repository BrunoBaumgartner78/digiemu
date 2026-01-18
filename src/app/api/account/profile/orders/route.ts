import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;

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
