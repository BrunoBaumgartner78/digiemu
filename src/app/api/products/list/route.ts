import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const where: any = {
      isActive: true,
      status: "ACTIVE",
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          priceCents: true,
          thumbnail: true,
          vendorId: true,
          vendor: { select: { name: true } },
          vendorProfile: { select: { id: true, isPublic: true, displayName: true, avatarUrl: true } },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, products, total });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
