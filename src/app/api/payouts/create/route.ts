import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { vendorId, amountCents } = await req.json();

  const payout = await prisma.payout.create({
    data: {
      vendorId,
      amountCents,
      status: "PENDING"
    }
  });

  return NextResponse.json({ payout });
}
