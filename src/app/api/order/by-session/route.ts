import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;

  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("session_id") || "";
  if (!sessionId) return NextResponse.json({ error: "MISSING_SESSION_ID" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true, buyerId: true, status: true },
  });

  if (!order) return NextResponse.json({ ready: false });

  if (order.buyerId !== userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  return NextResponse.json({ ready: true, orderId: order.id, status: order.status });
}
