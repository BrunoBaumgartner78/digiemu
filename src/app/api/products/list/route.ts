import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { vendor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
