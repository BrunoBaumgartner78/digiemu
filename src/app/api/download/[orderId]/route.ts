import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ orderId: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, context: Ctx) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const link = await prisma.downloadLink.findFirst({
    where: { orderId },
    select: { fileUrl: true, expiresAt: true, orderId: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Download not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, download: link });
}
