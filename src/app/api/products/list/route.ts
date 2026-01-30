import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ProductStatus } from "@prisma/client";

export async function GET() {
  try {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      status: ProductStatus.ACTIVE,
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
      vendor: { select: { name: true, isBlocked: true } },

          vendorProfile: { select: { id: true, isPublic: true, displayName: true, avatarUrl: true } },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, products, total });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
