import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.payout.update({
    where: { id },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
