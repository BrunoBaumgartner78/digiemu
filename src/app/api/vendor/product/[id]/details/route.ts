// src/app/api/vendor/product/[id]/details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorApi } from "@/lib/guards/authz";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const maybe = await requireVendorApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;

  const { id } = await params;
  const vendorId = session.user.id;

  // Optional: query params (z.B. includeStats=1)
  const { searchParams } = new URL(_req.url);
  const includeStats = searchParams.get("includeStats") === "1";

  const product = await prisma.product.findFirst({
    where: {
      id,
      vendorId, // nur eigenes Produkt
    },
    include: {
      // passe includes an dein Schema an (z.B. downloads/orders/reviews)
      orders: includeStats
        ? {
            select: {
              id: true,
              createdAt: true,
              amountCents: true,
              vendorEarningsCents: true,
            },
          }
        : false,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
