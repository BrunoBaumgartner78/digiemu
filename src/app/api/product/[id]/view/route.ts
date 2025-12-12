// src/app/api/product/[id]/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  try {
    // Wenn du ein ProductView-Model hast: hier anpassen
    // Minimal-Variante: updatedAt touchen oder view counter inkrementieren (falls vorhanden)
    await prisma.product.update({
      where: { id },
      data: {
        // Falls du ein Feld hast:
        // viewsCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("VIEW TRACK ERROR:", err);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
